import { supabase } from '@/lib/supabase';
import type { Student } from '@/types/database';

/** 로그인 user_id → parents.id */
export async function resolveParentEntityId(
  userId: string,
  academyId?: string
): Promise<string | null> {
  let q = supabase.from('parents').select('id').eq('user_id', userId);
  if (academyId) q = q.eq('academy_id', academyId);
  const { data } = await q.limit(1).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/** 학부모: 연결된 자녀 — parents → links → connections → legacy */
export async function fetchParentLinkedStudents(userId: string): Promise<{
  students: Student[];
  error: string | null;
}> {
  const parentIds: string[] = [];
  const studentIds = new Set<string>();

  const { data: parentRows } = await supabase.from('parents').select('id').eq('user_id', userId);
  for (const p of parentRows ?? []) {
    parentIds.push((p as { id: string }).id);
  }

  if (parentIds.length > 0) {
    const { data: links, error: linkErr } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .in('parent_id', parentIds);
    if (linkErr) return { students: [], error: linkErr.message };
    for (const l of links ?? []) {
      studentIds.add((l as { student_id: string }).student_id);
    }
  }

  if (studentIds.size === 0) {
    const { data: connLinks, error: connErr } = await supabase
      .from('student_connections')
      .select('student_id')
      .eq('user_id', userId)
      .in('relationship', ['mother', 'father', 'guardian']);
    if (connErr) return { students: [], error: connErr.message };
    for (const l of connLinks ?? []) {
      studentIds.add((l as { student_id: string }).student_id);
    }
  }

  if (studentIds.size === 0) {
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
    .in('id', [...studentIds])
    .order('name');

  const students = ((data ?? []) as Student[]).sort((a, b) =>
    a.name.localeCompare(b.name, 'ko')
  );
  return { students, error: error?.message ?? null };
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
  const { data: parents } = await supabase.from('parents').select('id').eq('user_id', parentUserId);
  const parentIds = (parents ?? []).map((p) => (p as { id: string }).id);

  if (parentIds.length > 0) {
    const { data: plink } = await supabase
      .from('parent_student_links')
      .select('id')
      .eq('student_id', studentId)
      .in('parent_id', parentIds)
      .limit(1)
      .maybeSingle();
    if (plink) return true;
  }

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
