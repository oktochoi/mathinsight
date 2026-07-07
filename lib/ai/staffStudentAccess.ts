import type { SupabaseClient } from '@supabase/supabase-js';
import type { StaffAuthResult } from '@/lib/api/staffAuth';

export async function assertStaffStudentAccess(
  supabase: SupabaseClient,
  auth: Extract<StaffAuthResult, { ok: true }>,
  studentId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data: student } = await supabase
    .from('students')
    .select('id, academy_id')
    .eq('id', studentId)
    .maybeSingle();

  if (!student || student.academy_id !== auth.academyId) {
    return { ok: false, status: 404, error: '학생을 찾을 수 없습니다.' };
  }

  if (auth.role !== 'teacher') {
    return { ok: true };
  }

  const { data: sp } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('user_id', auth.userId)
    .eq('academy_id', auth.academyId)
    .maybeSingle();

  const staffId = (sp as { id: string } | null)?.id;
  if (!staffId) {
    return { ok: false, status: 403, error: '담당 학생만 조회할 수 있습니다.' };
  }

  const { data: classRows } = await supabase
    .from('class_teachers')
    .select('class_id')
    .eq('staff_id', staffId)
    .is('end_date', null);

  let classIds = [...new Set((classRows ?? []).map((r) => (r as { class_id: string }).class_id))];

  if (classIds.length === 0) {
    const { data: legacy } = await supabase
      .from('classes')
      .select('id')
      .eq('academy_id', auth.academyId)
      .eq('teacher_id', auth.userId);
    classIds = (legacy ?? []).map((r) => (r as { id: string }).id);
  }

  if (classIds.length === 0) {
    return { ok: false, status: 403, error: '담당 반이 없어 이 학생에 접근할 수 없습니다.' };
  }

  const { data: enrolled } = await supabase
    .from('student_enrollments')
    .select('student_id')
    .eq('student_id', studentId)
    .in('class_id', classIds)
    .eq('status', 'active')
    .is('end_date', null)
    .limit(1);

  if (enrolled && enrolled.length > 0) {
    return { ok: true };
  }

  const { data: direct } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .in('class_id', classIds)
    .maybeSingle();

  if (direct) return { ok: true };

  return { ok: false, status: 403, error: '담당 학생만 조회할 수 있습니다.' };
}
