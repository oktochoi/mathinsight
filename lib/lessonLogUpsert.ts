import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureOperationalLessonsForRows } from '@/lib/ensureOperationalLesson';
import { deriveStudentStatusFromRisk } from '@/lib/studentRisk';
import type { LessonLog, LessonLogInsert } from '@/types/database';

function formatLessonLogSaveError(message: string): string {
  if (
    message.includes('lessons_status_check') ||
    message.includes("'held'") ||
    message.includes('held')
  ) {
    return '수업 상태 동기화 오류입니다. 잠시 후 다시 시도해 주세요. (DB 028 마이그레이션 미적용 시 Supabase SQL Editor에서 실행 필요)';
  }
  return message;
}

/** Upsert lesson_logs by (student_id, class_id, lesson_date) and refresh student status */
export async function upsertLessonLogs(
  supabase: SupabaseClient,
  rows: LessonLogInsert[]
): Promise<{ error: string | null }> {
  if (rows.length === 0) return { error: '저장할 기록이 없습니다.' };

  const ensure = await ensureOperationalLessonsForRows(supabase, rows);
  if (ensure.error) return { error: formatLessonLogSaveError(ensure.error) };

  const { error } = await supabase.from('lesson_logs').upsert(rows, {
    onConflict: 'student_id,class_id,lesson_date',
  });
  if (error) return { error: formatLessonLogSaveError(error.message) };

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  for (const sid of studentIds) {
    const { data: recent } = await supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', sid)
      .order('lesson_date', { ascending: false })
      .limit(12);
    const status = deriveStudentStatusFromRisk((recent ?? []) as LessonLog[]);
    await supabase.from('students').update({ status }).eq('id', sid);
  }

  return { error: null };
}
