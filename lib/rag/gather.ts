import type { SupabaseClient } from '@supabase/supabase-js';
import { serializeLessonLogsForPrompt } from '@/lib/ai/serializeLogs';
import { expandCalendarEvents, getWeekDates } from '@/lib/schedules';
import { DAY_LABELS } from '@/lib/scheduleLabels';
import type { RagChunk } from '@/lib/rag/types';
import type {
  ClassSchedule,
  ConsultationCard,
  LessonLog,
  ParentReport,
  ScheduleException,
  Student,
} from '@/types/database';

const LOG_DAYS = 56;

export async function gatherStudentRagChunks(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ chunks: RagChunk[]; student: Student & { academies?: { name: string } | null; classes?: { name: string } | null } } | null> {
  const since = new Date();
  since.setDate(since.getDate() - LOG_DAYS);
  const from = since.toISOString().slice(0, 10);

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

  const [logsRes, cardsRes, reportsRes, schedRes, exRes] = await Promise.all([
    supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('lesson_date', from)
      .order('lesson_date', { ascending: false })
      .limit(40),
    supabase
      .from('consultation_cards')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('parent_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(4),
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

  const logs = (logsRes.data ?? []) as LessonLog[];
  const cards = (cardsRes.data ?? []) as ConsultationCard[];
  const reports = (reportsRes.data ?? []) as ParentReport[];
  const chunks: RagChunk[] = [];

  chunks.push({
    id: 'profile',
    source: 'student_profile',
    text: `학생: ${st.name}, 학년: ${st.grade}, 반: ${st.classes?.name ?? '미지정'}, 학원: ${st.academies?.name ?? ''}`,
    keywords: [st.name, st.grade, '학생', '프로필'],
  });

  for (const log of logs) {
    if (log.test_score != null) {
      chunks.push({
        id: `score-${log.id}`,
        source: 'scores',
        date: log.lesson_date,
        text: `${log.lesson_date} 단원:${log.unit || '-'} 점수 ${log.test_score}점`,
        keywords: ['점수', '성적', log.unit ?? '', String(log.test_score)],
      });
    }
    chunks.push({
      id: `hw-${log.id}`,
      source: 'homework',
      date: log.lesson_date,
      text: `${log.lesson_date} 숙제:${log.homework_status} 단원:${log.unit || '-'}`,
      keywords: ['숙제', log.homework_status, log.unit ?? ''],
    });
    chunks.push({
      id: `att-${log.id}`,
      source: 'attendance',
      date: log.lesson_date,
      text: `${log.lesson_date} 출석:${log.attendance_status}`,
      keywords: ['출석', log.attendance_status],
    });
    if (log.tags?.length) {
      chunks.push({
        id: `tags-${log.id}`,
        source: 'tags',
        date: log.lesson_date,
        text: `${log.lesson_date} 학습태그: ${log.tags.join(', ')}`,
        keywords: [...log.tags, '태그'],
      });
    }
    if (log.memo?.trim()) {
      chunks.push({
        id: `memo-${log.id}`,
        source: 'memo',
        date: log.lesson_date,
        text: `${log.lesson_date} 메모: ${log.memo.trim()}`,
        keywords: ['메모', ...log.memo.split(/\s+/).slice(0, 8)],
      });
    }
  }

  if (logs.length > 0) {
    chunks.push({
      id: 'logs-serialized',
      source: 'scores',
      text: `[수업 기록 요약]\n${serializeLessonLogsForPrompt([...logs].reverse())}`,
      keywords: ['수업', '기록', '통합'],
    });
  }

  for (const c of cards) {
    chunks.push({
      id: `card-${c.id}`,
      source: 'consultation_card',
      date: c.period_end,
      text: `상담카드 ${c.period_start}~${c.period_end}: ${c.learning_summary.slice(0, 400)}${c.parent_message ? ` | 학부모메시지: ${c.parent_message.slice(0, 200)}` : ''}`,
      keywords: ['상담', '카드', '상담카드'],
    });
  }

  for (const r of reports) {
    chunks.push({
      id: `report-${r.id}`,
      source: 'parent_report',
      date: r.period_end,
      text: `학부모리포트 ${r.period_start}~${r.period_end}: ${r.report_text.slice(0, 500)}`,
      keywords: ['리포트', '학부모'],
    });
  }

  const schedules = (schedRes.data ?? []) as ClassSchedule[];
  const exceptions = (exRes.data ?? []) as ScheduleException[];
  if (st.class_id && schedules.length > 0) {
    const events = expandCalendarEvents(schedules, exceptions, getWeekDates(new Date()));
    const upcoming = events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).slice(0, 5);
    if (upcoming.length > 0) {
      chunks.push({
        id: 'schedule',
        source: 'schedule',
        text: upcoming
          .map(
            (e) =>
              `${e.date} ${DAY_LABELS[e.dayOfWeek] ?? ''} ${e.startTime.slice(0, 5)} ${e.title}`
          )
          .join('\n'),
        keywords: ['시간표', '수업', '일정'],
      });
    }
  }

  return { chunks, student: st };
}
