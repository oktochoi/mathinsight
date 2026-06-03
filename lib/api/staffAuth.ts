import type { SupabaseClient } from '@supabase/supabase-js';

export type StaffAuthResult =
  | { ok: true; userId: string; academyId: string; role: string }
  | { ok: false; status: number; error: string };

export async function requireStaff(
  supabase: SupabaseClient
): Promise<StaffAuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: '로그인이 필요합니다.' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, academy_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.academy_id) {
    return { ok: false, status: 403, error: '학원이 연결되지 않았습니다.' };
  }

  if (profile.role !== 'admin' && profile.role !== 'teacher') {
    return { ok: false, status: 403, error: '원장·강사만 이용할 수 있습니다.' };
  }

  return {
    ok: true,
    userId: user.id,
    academyId: profile.academy_id,
    role: profile.role,
  };
}
