import { supabase } from '@/lib/supabase';
import type { Student } from '@/types/database';

/** 학부모: 연결된 자녀 목록 */
export async function fetchParentLinkedStudents(userId: string): Promise<{
  students: Student[];
  error: string | null;
}> {
  const { data: links, error: linkErr } = await supabase
    .from('student_connections')
    .select('student_id')
    .eq('user_id', userId)
    .in('relationship', ['mother', 'father', 'guardian']);

  if (linkErr) return { students: [], error: linkErr.message };

  let ids = (links ?? []).map((l) => l.student_id as string);

  if (ids.length === 0) {
    const { data: legacy, error: legacyErr } = await supabase
      .from('students')
      .select('*, academies(id, name)')
      .eq('parent_user_id', userId);
    if (legacyErr) return { students: [], error: legacyErr.message };
    return { students: (legacy ?? []) as Student[], error: null };
  }

  const { data, error } = await supabase
    .from('students')
    .select('*, academies(id, name)')
    .in('id', ids);

  return { students: (data ?? []) as Student[], error: error?.message ?? null };
}

/** 학생: 본인 연결 프로필 */
export async function fetchStudentSelfProfile(userId: string): Promise<{
  student: Student | null;
  error: string | null;
}> {
  const { data: link, error: linkErr } = await supabase
    .from('student_connections')
    .select('student_id')
    .eq('user_id', userId)
    .eq('relationship', 'student')
    .maybeSingle();

  if (linkErr) return { student: null, error: linkErr.message };

  const studentId = link?.student_id as string | undefined;

  if (!studentId) {
    const { data: legacy, error: legacyErr } = await supabase
      .from('students')
      .select('*, academies(id, name)')
      .eq('student_user_id', userId)
      .maybeSingle();
    return { student: (legacy as Student) ?? null, error: legacyErr?.message ?? null };
  }

  const { data, error } = await supabase
    .from('students')
    .select('*, academies(id, name)')
    .eq('id', studentId)
    .maybeSingle();

  return { student: (data as Student) ?? null, error: error?.message ?? null };
}

/** 학부모가 해당 학생에 연결되어 있는지 */
export async function parentCanAccessStudent(
  parentUserId: string,
  studentId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('student_connections')
    .select('id')
    .eq('user_id', parentUserId)
    .eq('student_id', studentId)
    .in('relationship', ['mother', 'father', 'guardian'])
    .maybeSingle();
  if (data) return true;

  const { data: legacy } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_user_id', parentUserId)
    .maybeSingle();
  return !!legacy;
}
