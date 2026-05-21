import { supabase } from '@/lib/supabase';

export async function findPortalUserByEmail(
  email: string,
  role: 'parent' | 'student'
): Promise<{ id: string; email: string; name: string } | null> {
  const normalized = email.trim();
  if (!normalized) return null;

  const { data, error } = await supabase.rpc('find_portal_user_by_email', {
    p_email: normalized,
    p_role: role,
  });

  if (!error && data && Array.isArray(data) && data.length > 0) {
    const row = data[0] as { id: string; email: string; name: string };
    return row;
  }

  const { data: fallback, error: fbErr } = await supabase
    .from('users')
    .select('id, email, name, role')
    .ilike('email', normalized)
    .eq('role', role)
    .maybeSingle();

  if (fbErr || !fallback) return null;
  return { id: fallback.id, email: fallback.email, name: fallback.name };
}

export async function linkStudentPortals(
  studentId: string,
  options: { parentEmail?: string | null; studentEmail?: string | null }
): Promise<{ error: string | null; warnings: string[] }> {
  const updates: {
    parent_user_id?: string | null;
    student_user_id?: string | null;
    parent_invite_email?: string | null;
    student_invite_email?: string | null;
  } = {};
  const warnings: string[] = [];

  if (options.parentEmail !== undefined) {
    const raw = options.parentEmail?.trim() ?? '';
    updates.parent_invite_email = raw || null;
    if (!raw) {
      updates.parent_user_id = null;
    } else {
      const parent = await findPortalUserByEmail(raw, 'parent');
      if (!parent) {
        updates.parent_user_id = null;
        warnings.push(
          `학부모(${raw}): 가입된 「학부모」 계정을 찾지 못했습니다. 이메일은 저장했으며, 가입 후 다시 저장하면 연결됩니다.`
        );
      } else {
        updates.parent_user_id = parent.id;
      }
    }
  }

  if (options.studentEmail !== undefined) {
    const raw = options.studentEmail?.trim() ?? '';
    updates.student_invite_email = raw || null;
    if (!raw) {
      updates.student_user_id = null;
    } else {
      const student = await findPortalUserByEmail(raw, 'student');
      if (!student) {
        updates.student_user_id = null;
        warnings.push(
          `학생(${raw}): 가입된 「학생」 계정을 찾지 못했습니다. 이메일은 저장했으며, 가입 후 다시 저장하면 연결됩니다.`
        );
      } else {
        updates.student_user_id = student.id;
      }
    }
  }

  if (Object.keys(updates).length === 0) return { error: null, warnings: [] };

  const { error } = await supabase.from('students').update(updates).eq('id', studentId);
  if (error) return { error: error.message, warnings: [] };
  return { error: null, warnings };
}
