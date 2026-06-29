import { supabase } from '@/lib/supabase';
import type { AttendanceStatus, LessonLog } from '@/types/database';

export type LessonLogFilters = {
  academyId?: string;
  studentId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

/** lesson_logs 조회 + lesson_id 있으면 attendance_records·lesson_scores로 덮어쓰기 */
export async function fetchLessonLogs(
  filters: LessonLogFilters
): Promise<{ logs: LessonLog[]; error: string | null }> {
  let query = supabase
    .from('lesson_logs')
    .select('*, students(id, name, grade), lessons(id, status, unit)')
    .order('lesson_date', { ascending: false });

  if (filters.academyId) query = query.eq('academy_id', filters.academyId);
  if (filters.studentId) query = query.eq('student_id', filters.studentId);
  if (filters.classId) query = query.eq('class_id', filters.classId);
  if (filters.fromDate) query = query.gte('lesson_date', filters.fromDate);
  if (filters.toDate) query = query.lte('lesson_date', filters.toDate);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) return { logs: [], error: error.message };

  let logs = (data ?? []) as (LessonLog & { lesson_id?: string | null })[];

  const linked = logs.filter((l) => l.lesson_id);
  if (linked.length === 0) return { logs, error: null };

  const lessonIds = [...new Set(linked.map((l) => l.lesson_id!))];
  const [attRes, scoreRes] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('lesson_id, student_id, status')
      .in('lesson_id', lessonIds),
    supabase.from('lesson_scores').select('lesson_id, student_id, score').in('lesson_id', lessonIds),
  ]);

  const attMap = new Map(
    ((attRes.data ?? []) as { lesson_id: string; student_id: string; status: AttendanceStatus }[]).map(
      (a) => [`${a.lesson_id}:${a.student_id}`, a.status]
    )
  );
  const scoreMap = new Map(
    ((scoreRes.data ?? []) as { lesson_id: string; student_id: string; score: number }[]).map(
      (s) => [`${s.lesson_id}:${s.student_id}`, s.score]
    )
  );

  logs = logs.map((log) => {
    if (!log.lesson_id) return log;
    const key = `${log.lesson_id}:${log.student_id}`;
    const att = attMap.get(key);
    const score = scoreMap.get(key);
    return {
      ...log,
      attendance_status: att ?? log.attendance_status,
      test_score: score !== undefined ? score : log.test_score,
    };
  });

  return { logs, error: null };
}
