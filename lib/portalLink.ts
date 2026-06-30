import { supabase } from '@/lib/supabase';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findPortalUserByEmail(
  email: string,
  role: 'parent' | 'student'
): Promise<{ id: string; email: string; name: string } | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data, error } = await supabase.rpc('find_portal_user_by_email', {
    p_email: normalized,
    p_role: role,
  });

  if (error || !data?.length) return null;
  const row = data[0] as { id: string; email: string; name: string };
  return row;
}

async function upsertStudentConnection(
  studentId: string,
  userId: string,
  relationship: 'guardian' | 'student'
): Promise<string | null> {
  const { error } = await supabase.from('student_connections').upsert(
    { student_id: studentId, user_id: userId, relationship },
    { onConflict: 'student_id,user_id' }
  );
  return error?.message ?? null;
}

/** 학부모·학생 계정 이메일로 연결 (가입된 계정이 있으면 즉시 student_connections 생성) */
export async function linkStudentPortals(
  studentId: string,
  options: { parentEmail?: string; studentEmail?: string }
): Promise<{
  error: string | null;
  parentLinked: boolean;
  studentLinked: boolean;
}> {
  const parentEmail = options.parentEmail?.trim() ?? '';
  const studentEmail = options.studentEmail?.trim() ?? '';

  let parentLinked = false;
  let studentLinked = false;

  if (parentEmail) {
    const parent = await findPortalUserByEmail(parentEmail, 'parent');
    if (parent) {
      parentLinked = true;
      const connErr = await upsertStudentConnection(studentId, parent.id, 'guardian');
      if (connErr) return { error: connErr, parentLinked, studentLinked };
    }
  }

  if (studentEmail) {
    const portalUser = await findPortalUserByEmail(studentEmail, 'student');
    if (portalUser) {
      studentLinked = true;
      const connErr = await upsertStudentConnection(studentId, portalUser.id, 'student');
      if (connErr) return { error: connErr, parentLinked, studentLinked };
    }
  }

  return { error: null, parentLinked, studentLinked };
}
