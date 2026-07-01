import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureOperationalLessonsForRows } from '@/lib/ensureOperationalLesson';
import { deriveStudentStatusFromRisk } from '@/lib/studentRisk';
import type { AttendanceStatus, LessonLog, LessonLogInsert } from '@/types/database';

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

async function refreshStudentStatuses(
  supabase: SupabaseClient,
  studentIds: string[]
): Promise<void> {
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
  await refreshStudentStatuses(supabase, studentIds);

  return { error: null };
}

/** 출결 전용 — 기존 row는 attendance만 갱신, 신규는 최소 필드로 생성 */
export async function upsertAttendanceOnly(
  supabase: SupabaseClient,
  rows: {
    academy_id: string;
    class_id: string;
    student_id: string;
    teacher_id: string;
    lesson_date: string;
    attendance_status: AttendanceStatus;
  }[],
  existingByStudent: Map<string, LessonLog>
): Promise<{ error: string | null }> {
  if (rows.length === 0) return { error: '저장할 기록이 없습니다.' };

  const inserts: LessonLogInsert[] = [];
  const updates: { id: string; attendance_status: AttendanceStatus; teacher_id: string }[] = [];

  for (const row of rows) {
    const existing = existingByStudent.get(row.student_id);
    if (existing) {
      updates.push({
        id: existing.id,
        attendance_status: row.attendance_status,
        teacher_id: row.teacher_id,
      });
    } else {
      inserts.push({
        academy_id: row.academy_id,
        class_id: row.class_id,
        student_id: row.student_id,
        teacher_id: row.teacher_id,
        lesson_date: row.lesson_date,
        unit: '미입력',
        attendance_status: row.attendance_status,
        homework_status: 'complete',
        test_score: null,
        tags: [],
        memo: null,
      });
    }
  }

  if (inserts.length > 0) {
    const ensure = await ensureOperationalLessonsForRows(supabase, inserts);
    if (ensure.error) return { error: formatLessonLogSaveError(ensure.error) };

    const { error } = await supabase.from('lesson_logs').insert(inserts);
    if (error) return { error: formatLessonLogSaveError(error.message) };
  }

  for (const patch of updates) {
    const { error } = await supabase
      .from('lesson_logs')
      .update({
        attendance_status: patch.attendance_status,
        teacher_id: patch.teacher_id,
      })
      .eq('id', patch.id);
    if (error) return { error: formatLessonLogSaveError(error.message) };
  }

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  await refreshStudentStatuses(supabase, studentIds);

  return { error: null };
}
