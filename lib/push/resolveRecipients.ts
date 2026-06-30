import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

/** 학생에 연결된 학부모 user_id 목록 */
export async function parentUserIdsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<string[]> {
  const { data: links } = await supabase
    .from('student_connections')
    .select('user_id')
    .eq('student_id', studentId)
    .in('relationship', ['mother', 'father', 'guardian']);

  return [...new Set((links ?? []).map((l) => l.user_id as string))];
}

/** 학생에 연결된 학생 포털 user_id */
export async function studentUserIdsForStudent(
  supabase: SupabaseClient,
  studentId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('student_connections')
    .select('user_id')
    .eq('student_id', studentId)
    .eq('relationship', 'student');

  return (data ?? []).map((r) => r.user_id as string);
}

/** 반 담당 강사 user_id (class_teachers + legacy classes.teacher_id) */
export async function teacherUserIdsForClass(
  supabase: SupabaseClient,
  classId: string,
  academyId: string
): Promise<string[]> {
  const ids: string[] = [];

  const { data: assignments } = await supabase
    .from('class_teachers')
    .select('staff_id')
    .eq('class_id', classId)
    .is('end_date', null);

  const staffIds = (assignments ?? []).map((r) => r.staff_id as string).filter(Boolean);
  if (staffIds.length > 0) {
    const { data: profiles } = await supabase
      .from('staff_profiles')
      .select('user_id')
      .in('id', staffIds);
    ids.push(...(profiles ?? []).map((p) => p.user_id as string));
  }

  const { data: legacy } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (legacy?.teacher_id) ids.push(legacy.teacher_id as string);

  return [...new Set(ids)];
}

/** 학생 반의 담당 강사 user_id */
export async function teacherUserIdsForStudent(
  supabase: SupabaseClient,
  studentId: string,
  academyId: string
): Promise<string[]> {
  const { data: student } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .maybeSingle();

  const classId = student?.class_id as string | undefined;
  if (!classId) return [];

  return teacherUserIdsForClass(supabase, classId, academyId);
}

/** 원장·원무 user_id */
export async function ownerDeskUserIds(
  supabase: SupabaseClient,
  academyId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('academy_id', academyId)
    .in('role', ['admin', 'desk']);

  return (data ?? []).map((r) => r.id as string);
}

/** user_id 목록에 대한 FCM 토큰 (서비스 롤 필요) */
export async function pushTokensForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const { data } = await admin
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  return (data ?? []).map((r) => r.token as string).filter(Boolean);
}
