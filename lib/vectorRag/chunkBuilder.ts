import type { SupabaseClient } from '@supabase/supabase-js';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import { DAY_LABELS } from '@/lib/scheduleLabels';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import type { MemoryChunkDraft } from '@/lib/vectorRag/types';
import type {
  ClassSchedule,
  ConsultationCard,
  LessonLog,
  ParentReport,
  ScheduleException,
  Student,
} from '@/types/database';

const HW_KO: Record<string, string> = {
  complete: '완료',
  partial: '부분',
  missing: '미제출',
};

export async function buildStudentMemoryChunks(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ academyId: string; studentName: string; drafts: MemoryChunkDraft[] } | null> {
  const { data: student, error } = await supabase
    .from('students')
    .select('*, academies(name), classes(name)')
    .eq('id', studentId)
    .maybeSingle();

  if (error || !student) return null;

  const st = student as Student & {
    academies?: { name: string } | null;
    classes?: { name: string } | null;
  };

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const from = since.toISOString().slice(0, 10);

  const [logsRes, cardsRes, reportsRes, riskRes, schedRes, exRes] = await Promise.all([
    supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('lesson_date', from)
      .order('lesson_date', { ascending: false })
      .limit(60),
    supabase
      .from('consultation_cards')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('parent_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('student_risk_signals')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    st.class_id
      ? supabase.from('class_schedules').select('*').eq('class_id', st.class_id)
      : Promise.resolve({ data: [] }),
    st.class_id
      ? supabase
          .from('schedule_exceptions')
          .select('*')
          .eq('class_id', st.class_id)
          .gte('exception_date', from)
      : Promise.resolve({ data: [] }),
  ]);

  const drafts: MemoryChunkDraft[] = [];

  drafts.push({
    source_type: 'student_profile',
    source_id: st.id,
    title: '학생 프로필',
    content: `[학생 프로필]\n이름: ${st.name}\n학년: ${st.grade}\n반: ${st.classes?.name ?? '미지정'}\n학원: ${st.academies?.name ?? ''}`,
    metadata: { grade: st.grade },
  });

  for (const log of (logsRes.data ?? []) as LessonLog[]) {
    const hw = HW_KO[log.homework_status] ?? log.homework_status;
    const att = ATTENDANCE_LABELS[log.attendance_status] ?? log.attendance_status;
    const scorePart = log.test_score != null ? `\n점수 ${log.test_score}점` : '';
    const tagPart = log.tags?.length ? `\n태그: ${log.tags.join(', ')}` : '';

    drafts.push({
      source_type: 'lesson_log',
      source_id: log.id,
      title: `수업 ${log.lesson_date}`,
      content: `[수업기록]\n${st.name}\n${log.lesson_date}\n${log.unit || '단원 미기재'}\n숙제 ${hw}${scorePart}\n출석 ${att}${tagPart}`,
      metadata: { lesson_date: log.lesson_date },
    });

    if (log.memo?.trim()) {
      drafts.push({
        source_type: 'memo',
        source_id: log.id,
        title: `메모 ${log.lesson_date}`,
        content: `[수업 메모]\n${st.name}\n${log.lesson_date}\n${log.memo.trim()}`,
        metadata: { lesson_date: log.lesson_date },
      });
    }

    if (log.tags?.length) {
      drafts.push({
        source_type: 'tag',
        source_id: log.id,
        title: `태그 ${log.lesson_date}`,
        content: `[학습 태그]\n${st.name}\n${log.lesson_date}\n${log.tags.join(', ')}`,
        metadata: { tags: log.tags },
      });
    }
  }

  for (const c of (cardsRes.data ?? []) as ConsultationCard[]) {
    drafts.push({
      source_type: 'consultation_card',
      source_id: c.id,
      title: `상담 ${c.period_start}~${c.period_end}`,
      content: `[상담카드]\n${st.name}\n기간 ${c.period_start}~${c.period_end}\n요약: ${c.learning_summary}\n학부모 메시지: ${c.parent_message || '없음'}`,
      metadata: { status: c.consultation_status },
    });
  }

  for (const r of (reportsRes.data ?? []) as ParentReport[]) {
    drafts.push({
      source_type: 'parent_report',
      source_id: r.id,
      title: `리포트 ${r.period_start}~${r.period_end}`,
      content: `[학부모리포트]\n${st.name}\n${r.period_start}~${r.period_end}\n${r.report_text.slice(0, 1200)}`,
    });
  }

  for (const risk of riskRes.data ?? []) {
    drafts.push({
      source_type: 'risk_signal',
      source_id: risk.id as string,
      title: `위험신호 ${risk.risk_level}`,
      content: `[위험신호]\n${st.name}\n등급: ${risk.risk_level}\n사유: ${risk.reason}`,
      metadata: { risk_level: risk.risk_level },
    });
  }

  const schedules = (schedRes.data ?? []) as ClassSchedule[];
  const exceptions = (exRes.data ?? []) as ScheduleException[];
  if (st.class_id && schedules.length > 0) {
    const events = expandCalendarEvents(schedules, exceptions, getWeekDates(new Date()));
    const lines = events
      .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 8)
      .map(
        (e) =>
          `${e.date} ${DAY_LABELS[e.dayOfWeek] ?? ''} ${e.startTime.slice(0, 5)} ${e.title}`
      );
    if (lines.length) {
      drafts.push({
        source_type: 'schedule',
        source_id: st.class_id,
        title: '다가오는 수업',
        content: `[수업일정]\n${st.name}\n${lines.join('\n')}`,
      });
    }
  }

  return {
    academyId: st.academy_id,
    studentName: st.name,
    drafts,
  };
}
