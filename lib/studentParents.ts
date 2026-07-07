import { supabase } from '@/lib/supabase';

/** 상담 세션 생성 시 parent_id · enrollment_id · counselor_id 해석 */
export async function resolveCounselingContext(
  academyId: string,
  studentId: string,
  userId: string
) {
  const [parentRes, enrRes, staffRes] = await Promise.all([
    supabase
      .from('parent_student_links')
      .select('parent_id')
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('student_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('academy_id', academyId)
      .maybeSingle(),
  ]);

  return {
    parentId: (parentRes.data as { parent_id?: string } | null)?.parent_id ?? null,
    enrollmentId: (enrRes.data as { id?: string } | null)?.id ?? null,
    counselorId: (staffRes.data as { id?: string } | null)?.id ?? null,
  };
}

/** users.id → counseling_sessions.counselor_id (staff_profiles.id) */
export async function resolveStaffProfileId(academyId: string, userId: string) {
  const { data } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('academy_id', academyId)
    .maybeSingle();

  return (data as { id?: string } | null)?.id ?? null;
}

/** 학생의 primary 보호자 (parents 엔티티) */
export async function fetchStudentParents(studentId: string) {
  const { data } = await supabase
    .from('parent_student_links')
    .select('*, parents(*)')
    .eq('student_id', studentId)
    .order('is_primary', { ascending: false });

  return (data ?? []) as {
    parent_id: string;
    is_primary: boolean;
    relationship: string;
    parents?: {
      id: string;
      name: string;
      phone: string | null;
      user_id: string | null;
    } | null;
  }[];
}
