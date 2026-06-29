import { supabase } from '@/lib/supabase';
import { normalizeUserProfile, toDbRole, type SignupRole } from '@/lib/roles';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';

export type { SignupRole } from '@/lib/roles';

async function fetchUserProfile(
  userId: string,
  client: SupabaseClient
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeUserProfile(data as UserProfile);
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
  meta: EnsureProfileMeta,
  client: SupabaseClient = supabase
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const existing = await fetchUserProfile(userId, client);
  if (existing) return { profile: existing, error: null };

  const { data: rpcResult, error: rpcError } = await client.rpc('ensure_user_profile');

  if (!rpcError && rpcResult && typeof rpcResult === 'object' && (rpcResult as { ok?: boolean }).ok) {
    const profile = await fetchUserProfile(userId, client);
    if (profile) return { profile, error: null };
  }

  const clientResult = await ensureUserProfileClient(userId, meta, client);
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
  meta: EnsureProfileMeta,
  client: SupabaseClient
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const {
    data: { user },
  } = await client.auth.getUser();

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
  const role = meta.role || 'parent';
  const academyName =
    meta.academyName?.trim() ||
    (user.user_metadata?.academy_name as string | undefined)?.trim() ||
    '';

  const resolvedAcademyName = academyName || '내 학원';
  if (role === 'owner') {
    const academyName = resolvedAcademyName;
    let academyId: string | null = null;

    const { data: owned } = await client
      .from('academies')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (owned?.id) {
      academyId = owned.id;
    } else {
      const { data: created, error: acErr } = await client
        .from('academies')
        .insert({ name: academyName, owner_id: userId })
        .select('id')
        .single();
      if (acErr) return { profile: null, error: acErr.message };
      academyId = created.id;
    }

    const { error: userErr } = await client.from('users').upsert(
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

    const { count } = await client
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId);

    if ((count ?? 0) === 0) {
      const { error: classErr } = await client.from('classes').insert({
        academy_id: academyId,
        teacher_id: userId,
        name: 'A반',
        grade: '중1',
      });
      if (classErr) return { profile: null, error: classErr.message };
    }
  } else {
    const dbRole = toDbRole(role);
    const { error: userErr } = await client.from('users').upsert(
      {
        id: userId,
        email,
        name,
        role: dbRole,
        academy_id: null,
      },
      { onConflict: 'id' }
    );
    if (userErr) return { profile: null, error: userErr.message };
  }

  const profile = await fetchUserProfile(userId, client);
  return { profile, error: profile ? null : '프로필 저장 후 조회에 실패했습니다.' };
}
