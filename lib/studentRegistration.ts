import { supabase } from '@/lib/supabase';
import { normalizePhoneKr } from '@/lib/phone';
import { fetchStudentParents } from '@/lib/studentParents';

export type GuardianInput = {
  /** 기존 parents.id (수정 시) */
  parentId?: string;
  name: string;
  relationship: 'mother' | 'father' | 'guardian' | 'other';
  phone: string;
  email?: string;
};

async function upsertParentByPhone(
  academyId: string,
  guardian: GuardianInput
): Promise<{ error: string | null; parentId?: string }> {
  const phone = normalizePhoneKr(guardian.phone);
  if (!guardian.name.trim() || !phone) {
    return { error: null };
  }

  if (guardian.parentId) {
    const { error } = await supabase
      .from('parents')
      .update({
        name: guardian.name.trim(),
        phone,
        email: guardian.email?.trim() || null,
      })
      .eq('id', guardian.parentId)
      .eq('academy_id', academyId);
    if (error) return { error: error.message };
    return { error: null, parentId: guardian.parentId };
  }

  const { data: existingParents } = await supabase
    .from('parents')
    .select('id, phone')
    .eq('academy_id', academyId);

  const existing = (existingParents ?? []).find(
    (row) => normalizePhoneKr((row as { phone?: string }).phone ?? '') === phone
  );

  let parentId: string;

  if (existing?.id) {
    parentId = existing.id as string;
    const { error } = await supabase
      .from('parents')
      .update({ name: guardian.name.trim(), email: guardian.email?.trim() || null })
      .eq('id', parentId);
    if (error) return { error: error.message };
  } else {
    const { data: created, error: parentErr } = await supabase
      .from('parents')
      .insert({
        academy_id: academyId,
        name: guardian.name.trim(),
        phone,
        email: guardian.email?.trim() || null,
        preferred_channel: 'sms',
      })
      .select('id')
      .single();
    if (parentErr || !created) {
      return { error: parentErr?.message ?? '보호자 등록에 실패했습니다.' };
    }
    parentId = created.id as string;
  }

  return { error: null, parentId };
}

export async function fetchStudentGuardianInputs(studentId: string): Promise<GuardianInput[]> {
  const links = await fetchStudentParents(studentId);
  if (links.length === 0) {
    return [{ name: '', relationship: 'mother', phone: '', email: '' }];
  }
  return links.map((link) => ({
    parentId: link.parent_id,
    name: link.parents?.name ?? '',
    phone: link.parents?.phone ?? '',
    email: (link.parents as { email?: string } | null)?.email ?? '',
    relationship: (link.relationship as GuardianInput['relationship']) || 'guardian',
  }));
}

export async function registerStudentWithGuardians(
  academyId: string,
  student: {
    name: string;
    grade: string;
    class_id: string | null;
    school: string;
    phone?: string;
    status?: string;
  },
  guardians: GuardianInput[]
): Promise<{ error: string | null; studentId?: string }> {
  const studentPhone = student.phone ? normalizePhoneKr(student.phone) : null;

  const { data: studentRow, error: studentErr } = await supabase
    .from('students')
    .insert({
      academy_id: academyId,
      name: student.name.trim(),
      grade: student.grade,
      class_id: student.class_id,
      school: student.school?.trim() || null,
      phone: studentPhone || null,
      status: student.status ?? 'stable',
      enrollment_status: 'active',
      registered_at: new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single();

  if (studentErr || !studentRow) {
    return { error: studentErr?.message ?? '학생 등록에 실패했습니다.' };
  }

  const studentId = studentRow.id as string;
  const { error: syncErr } = await syncStudentGuardians(academyId, studentId, guardians, []);
  if (syncErr) return { error: syncErr };

  return { error: null, studentId };
}

/** 학생 보호자 목록 동기화 (추가·수정·삭제) */
export async function syncStudentGuardians(
  academyId: string,
  studentId: string,
  guardians: GuardianInput[],
  previousParentIds: string[]
): Promise<{ error: string | null }> {
  const valid = guardians.filter((g) => g.name.trim() && normalizePhoneKr(g.phone));
  const keptParentIds: string[] = [];

  for (const g of valid) {
    const { error, parentId } = await upsertParentByPhone(academyId, g);
    if (error) return { error };
    if (!parentId) continue;

    keptParentIds.push(parentId);

    const { error: linkErr } = await supabase.from('parent_student_links').upsert(
      {
        parent_id: parentId,
        student_id: studentId,
        relationship: g.relationship,
        is_primary: g.relationship === 'mother',
      },
      { onConflict: 'parent_id,student_id' }
    );
    if (linkErr) return { error: linkErr.message };
  }

  const removeIds = previousParentIds.filter((id) => !keptParentIds.includes(id));
  if (removeIds.length > 0) {
    const { error } = await supabase
      .from('parent_student_links')
      .delete()
      .eq('student_id', studentId)
      .in('parent_id', removeIds);
    if (error) return { error: error.message };
  }

  return { error: null };
}

/** 가입된 보호자 계정이 있으면 즉시 연결 */
export async function linkRegisteredParentByPhone(
  academyId: string,
  studentId: string,
  phone: string
): Promise<boolean> {
  const normalized = normalizePhoneKr(phone);
  if (!normalized) return false;

  const { data: parentRow } = await supabase
    .from('parents')
    .select('id, user_id')
    .eq('academy_id', academyId)
    .eq('phone', normalized)
    .maybeSingle();

  if (!parentRow?.user_id) return false;

  await supabase.from('student_connections').upsert(
    {
      student_id: studentId,
      user_id: parentRow.user_id,
      relationship: 'guardian',
    },
    { onConflict: 'student_id,user_id' }
  );

  return true;
}

export async function linkRegisteredStudentByPhone(
  academyId: string,
  studentId: string,
  phone: string
): Promise<boolean> {
  const normalized = normalizePhoneKr(phone);
  if (!normalized) return false;

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'student')
    .eq('phone', normalized)
    .maybeSingle();

  if (!userRow?.id) return false;

  await supabase.from('student_connections').upsert(
    { student_id: studentId, user_id: userRow.id, relationship: 'student' },
    { onConflict: 'student_id,user_id' }
  );

  return true;
}
