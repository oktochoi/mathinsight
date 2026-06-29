import { supabase } from '@/lib/supabase';
import { loadTodayLessonRows } from '@/hooks/useTodayLesson';
import type { AttendanceStatus, HomeworkStatus, LessonLog } from '@/types/database';

/** 반·날짜 단위 운영 데이터 — lessons 우선, lesson_logs 폴백 */
export async function loadClassDayData(
  academyId: string,
  classId: string,
  lessonDate: string,
  studentIds: string[]
) {
  const [rows, logsRes] = await Promise.all([
    loadTodayLessonRows(classId, lessonDate, studentIds),
    supabase
      .from('lesson_logs')
      .select('*')
      .eq('academy_id', academyId)
      .eq('class_id', classId)
      .eq('lesson_date', lessonDate),
  ]);

  const existingLogs = new Map<string, LessonLog>();
  for (const log of (logsRes.data ?? []) as LessonLog[]) {
    existingLogs.set(log.student_id, log);
  }

  const attendance: Record<string, AttendanceStatus> = {};
  const homework: Record<string, HomeworkStatus> = {};
  for (const sid of studentIds) {
    const row = rows[sid];
    attendance[sid] = row?.attendance ?? 'present';
    homework[sid] = row?.homework ?? 'complete';
  }

  return { rows, existingLogs, attendance, homework };
}

export type ClassScorePoint = {
  student_id: string;
  class_id: string;
  lesson_date: string;
  test_score: number;
};

/** 성적 추세용 — lesson_scores 우선, lesson_logs 폴백 */
export async function loadClassScorePoints(classId: string, limit = 300): Promise<ClassScorePoint[]> {
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, lesson_date')
    .eq('class_id', classId)
    .order('lesson_date', { ascending: false })
    .limit(60);

  if (lessons && lessons.length > 0) {
    const lessonIds = lessons.map((l) => (l as { id: string }).id);
    const dateByLesson = new Map(
      lessons.map((l) => [(l as { id: string }).id, (l as { lesson_date: string }).lesson_date])
    );
    const { data: scores } = await supabase
      .from('lesson_scores')
      .select('student_id, score, lesson_id')
      .in('lesson_id', lessonIds);

    const points = ((scores ?? []) as { student_id: string; score: number; lesson_id: string }[])
      .map((s) => ({
        student_id: s.student_id,
        class_id: classId,
        lesson_date: dateByLesson.get(s.lesson_id) ?? '',
        test_score: s.score,
      }))
      .filter((p) => p.lesson_date);

    if (points.length > 0) return points.slice(0, limit);
  }

  const { data: logs } = await supabase
    .from('lesson_logs')
    .select('student_id, lesson_date, test_score')
    .eq('class_id', classId)
    .not('test_score', 'is', null)
    .order('lesson_date', { ascending: false })
    .limit(limit);

  return ((logs ?? []) as { student_id: string; lesson_date: string; test_score: number }[]).map(
    (l) => ({
      student_id: l.student_id,
      class_id: classId,
      lesson_date: l.lesson_date,
      test_score: l.test_score,
    })
  );
}
