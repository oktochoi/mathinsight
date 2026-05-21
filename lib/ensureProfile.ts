import { supabase } from '@/lib/supabase';
import type { UserProfile, UserRole } from '@/types/database';

export type SignupRole = 'admin' | 'parent' | 'student';

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserProfile;
}

export type EnsureProfileMeta = {
  email: string;
  name: string;
  role: SignupRole;
  academyName?: string;
};

/** RPC 또는 클라이언트 INSERT로 public.users(·학원·반) 생성 */
export async function ensureUserProfile(
  userId: string,
  meta: EnsureProfileMeta
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const existing = await fetchUserProfile(userId);
  if (existing) return { profile: existing, error: null };

  const { data: rpcResult, error: rpcError } = await supabase.rpc('ensure_user_profile');

  if (!rpcError && rpcResult && typeof rpcResult === 'object' && (rpcResult as { ok?: boolean }).ok) {
    const profile = await fetchUserProfile(userId);
    if (profile) return { profile, error: null };
  }

  const clientResult = await ensureUserProfileClient(userId, meta);
  if (clientResult.profile) return clientResult;

  const rpcMsg =
    rpcError?.message ??
    (rpcResult && typeof rpcResult === 'object' && 'error' in rpcResult
      ? String((rpcResult as { error?: string }).error)
      : null);

  return {
    profile: null,
    error:
      clientResult.error ??
      rpcMsg ??
      '프로필을 만들지 못했습니다. Supabase SQL Editor에서 002·005 마이그레이션을 실행해 주세요.',
  };
}

async function ensureUserProfileClient(
  userId: string,
  meta: EnsureProfileMeta
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return {
      profile: null,
      error: '로그인 세션이 없어 프로필을 만들 수 없습니다. 로그인 후 다시 시도해 주세요.',
    };
  }

  const email = meta.email || user.email || '';
  const name =
    meta.name?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    email.split('@')[0] ||
    '사용자';
  const role = (meta.role || (user.user_metadata?.role as SignupRole) || 'parent') as SignupRole;
  const academyName =
    meta.academyName?.trim() ||
    (user.user_metadata?.academy_name as string | undefined)?.trim() ||
    '';

  if (role === 'admin' && academyName) {
    let academyId: string | null = null;

    const { data: owned } = await supabase
      .from('academies')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (owned?.id) {
      academyId = owned.id;
    } else {
      const { data: created, error: acErr } = await supabase
        .from('academies')
        .insert({ name: academyName, owner_id: userId })
        .select('id')
        .single();
      if (acErr) return { profile: null, error: acErr.message };
      academyId = created.id;
    }

    const { error: userErr } = await supabase.from('users').upsert(
      {
        id: userId,
        email,
        name,
        role: 'admin',
        academy_id: academyId,
      },
      { onConflict: 'id' }
    );
    if (userErr) return { profile: null, error: userErr.message };

    const { count } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId);

    if ((count ?? 0) === 0) {
      const { error: classErr } = await supabase.from('classes').insert({
        academy_id: academyId,
        teacher_id: userId,
        name: 'A반',
        grade: '중1',
      });
      if (classErr) return { profile: null, error: classErr.message };
    }
  } else {
    const { error: userErr } = await supabase.from('users').upsert(
      {
        id: userId,
        email,
        name,
        role: role === 'admin' ? 'admin' : role,
        academy_id: null,
      },
      { onConflict: 'id' }
    );
    if (userErr) return { profile: null, error: userErr.message };
  }

  const profile = await fetchUserProfile(userId);
  return { profile, error: profile ? null : '프로필 저장 후 조회에 실패했습니다.' };
}
