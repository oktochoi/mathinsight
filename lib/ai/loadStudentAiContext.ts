import type { SupabaseClient } from '@supabase/supabase-js';
import type { LessonLog, Student } from '@/types/database';
import type { StaffAuthResult } from '@/lib/api/staffAuth';
import { assertStaffStudentAccess } from '@/lib/ai/staffStudentAccess';
import { AI_LIMITS } from '@/lib/ai/security';

export type StudentAiContext = {
  student: Pick<Student, 'id' | 'name' | 'grade'>;
  academyName: string;
  logs: LessonLog[];
};

export async function loadStudentAiContext(
  supabase: SupabaseClient,
  auth: Extract<StaffAuthResult, { ok: true }>,
  input: { studentId: string; periodStart: string; periodEnd: string }
): Promise<
  | { ok: true; ctx: StudentAiContext }
  | { ok: false; status: number; error: string }
> {
  const access = await assertStaffStudentAccess(supabase, auth, input.studentId);
  if (!access.ok) {
    return { ok: false, status: access.status, error: access.error };
  }

  const { data: row } = await supabase
    .from('students')
    .select('id, name, grade, academies(name)')
    .eq('id', input.studentId)
    .eq('academy_id', auth.academyId)
    .maybeSingle();

  if (!row) {
    return { ok: false, status: 404, error: '학생을 찾을 수 없습니다.' };
  }

  const academyJoin = row.academies as { name: string } | { name: string }[] | null;
  const academyName = Array.isArray(academyJoin) ? academyJoin[0]?.name : academyJoin?.name;

  const { data: logs, error } = await supabase
    .from('lesson_logs')
    .select('*')
    .eq('student_id', input.studentId)
    .eq('academy_id', auth.academyId)
    .gte('lesson_date', input.periodStart)
    .lte('lesson_date', input.periodEnd)
    .order('lesson_date', { ascending: false })
    .limit(AI_LIMITS.maxLogsInPrompt);

  if (error) {
    return { ok: false, status: 500, error: '수업 기록을 불러오지 못했습니다.' };
  }

  return {
    ok: true,
    ctx: {
      student: {
        id: row.id as string,
        name: row.name as string,
        grade: row.grade as string,
      },
      academyName: academyName ?? '학원',
      logs: (logs ?? []) as LessonLog[],
    },
  };
}
