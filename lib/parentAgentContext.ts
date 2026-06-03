import type { SupabaseClient } from '@supabase/supabase-js';
import { serializeLessonLogsForPrompt } from '@/lib/ai/serializeLogs';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import { DAY_LABELS } from '@/lib/scheduleLabels';
import type {
  ClassSchedule,
  ConsultationCard,
  LessonLog,
  ParentReport,
  ScheduleException,
  Student,
} from '@/types/database';

export interface ParentAgentContextBundle {
  studentId: string;
  studentName: string;
  grade: string;
  academyName: string;
  contextText: string;
}

const MAX_LOGS_FOR_AGENT = 24;

export async function buildParentAgentContext(
  supabase: SupabaseClient,
  studentId: string
): Promise<ParentAgentContextBundle | null> {
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

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const from = fourWeeksAgo.toISOString().slice(0, 10);

  const [logsRes, cardsRes, reportsRes, schedRes, exRes] = await Promise.all([
    supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('lesson_date', from)
      .order('lesson_date', { ascending: true }),
    supabase
      .from('consultation_cards')
      .select('period_start, period_end, learning_summary, parent_message, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('parent_reports')
      .select('period_start, period_end, report_text, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(2),
    st.class_id
      ? supabase
          .from('class_schedules')
          .select('*')
          .eq('class_id', st.class_id)
          .eq('is_visible_to_parent', true)
      : Promise.resolve({ data: [] }),
    st.class_id
      ? supabase
          .from('schedule_exceptions')
          .select('*')
          .eq('class_id', st.class_id)
          .eq('is_visible_to_parent', true)
          .gte('exception_date', from)
      : Promise.resolve({ data: [] }),
  ]);

  const logs = ((logsRes.data ?? []) as LessonLog[]).slice(-MAX_LOGS_FOR_AGENT);
  const cards = (cardsRes.data ?? []) as Pick<
    ConsultationCard,
    'period_start' | 'period_end' | 'learning_summary' | 'parent_message' | 'created_at'
  >[];
  const reports = (reportsRes.data ?? []) as Pick<
    ParentReport,
    'period_start' | 'period_end' | 'report_text' | 'created_at'
  >[];

  const sections: string[] = [
    '=== 조회 범위 (이 블록만 사용) ===',
    `학생 ID: ${studentId}`,
    `학생 이름: ${st.name}`,
    `학원: ${st.academies?.name ?? '학원'}`,
    `학년: ${st.grade}`,
    `반: ${st.classes?.name ?? '미지정'}`,
    `기준 기간: 최근 4주 (${from} ~ ${new Date().toISOString().slice(0, 10)})`,
    '※ 다른 학생·다른 반 학생의 기록은 없습니다. 위 학생 데이터만 근거로 답하세요.',
    '',
    '[수업 기록 — 해당 학생만]',
    serializeLessonLogsForPrompt(logs),
  ];

  if (cards.length > 0) {
    sections.push('', '[상담 카드 요약 (학부모 공개 범위)]');
    for (const c of cards) {
      sections.push(
        `- ${c.period_start}~${c.period_end}: ${c.learning_summary.slice(0, 200)}`
      );
      if (c.parent_message) {
        sections.push(`  학부모 메시지: ${c.parent_message.slice(0, 150)}`);
      }
    }
  }

  if (reports.length > 0) {
    sections.push('', '[학부모 리포트]');
    for (const r of reports) {
      sections.push(
        `- ${r.period_start}~${r.period_end}: ${r.report_text.slice(0, 300)}${r.report_text.length > 300 ? '…' : ''}`
      );
    }
  }

  const schedules = (schedRes.data ?? []) as ClassSchedule[];
  const exceptions = (exRes.data ?? []) as ScheduleException[];
  if (st.class_id && schedules.length > 0) {
    const events = expandCalendarEvents(schedules, exceptions, getWeekDates(new Date()));
    const upcoming = events
      .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 6);
    if (upcoming.length > 0) {
      sections.push('', '[다가오는 수업 일정]');
      for (const e of upcoming) {
        sections.push(
          `- ${e.date} ${DAY_LABELS[e.dayOfWeek] ?? ''} ${e.startTime.slice(0, 5)}-${e.endTime.slice(0, 5)} ${e.title}${e.location ? ` (${e.location})` : ''}`
        );
      }
    }
  }

  return {
    studentId,
    studentName: st.name,
    grade: st.grade,
    academyName: st.academies?.name ?? '학원',
    contextText: sections.join('\n'),
  };
}
