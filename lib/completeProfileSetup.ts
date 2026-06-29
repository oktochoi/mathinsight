import { supabase } from '@/lib/supabase';
import { ensureUserProfile, type SignupRole } from '@/lib/ensureProfile';
import { repairProfileRole } from '@/lib/profileIntegrity';
import { normalizeUserProfile, toDbRole } from '@/lib/roles';
import {
  PROFILE_SETUP_COMPLETE,
  PROFILE_SETUP_PENDING,
} from '@/lib/authProfileSetup';
import type { UserProfile } from '@/types/database';

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const profile = normalizeUserProfile(data as UserProfile);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.id === userId ? user.user_metadata : undefined;
  return repairProfileRole(userId, profile, meta);
}

export async function completeProfileSetup(params: {
  role: SignupRole;
  name?: string;
  academyName?: string;
}): Promise<{ error: string | null; profile: UserProfile | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.', profile: null };
  }

  const displayName =
    params.name?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '사용자';

  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      name: displayName,
      role: params.role,
      academy_name: params.role === 'owner' ? params.academyName?.trim() : null,
      profile_setup: PROFILE_SETUP_COMPLETE,
    },
  });

  if (metaError) {
    return { error: metaError.message, profile: null };
  }

  let profile = await fetchUserProfile(user.id);

  if (profile) {
    const synced = await syncExistingProfile(user.id, user.email ?? '', displayName, params);
    if (synced.error) return { error: synced.error, profile: null };
    profile = synced.profile;
  } else {
    const ensured = await ensureUserProfile(user.id, {
      email: user.email ?? '',
      name: displayName,
      role: params.role,
      academyName: params.role === 'owner' ? params.academyName : undefined,
    });
    profile = ensured.profile;
    if (!profile) {
      return {
        error: ensured.error ?? '프로필을 저장하지 못했습니다.',
        profile: null,
      };
    }
  }

  return { error: null, profile };
}

async function syncExistingProfile(
  userId: string,
  email: string,
  name: string,
  params: { role: SignupRole; academyName?: string }
): Promise<{ error: string | null; profile: UserProfile | null }> {
  if (params.role === 'owner') {
    const academyName = (params.academyName?.trim()) || '내 학원';
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
      if (acErr) return { error: acErr.message, profile: null };
      academyId = created.id;

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
        if (classErr) return { error: classErr.message, profile: null };
      }
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({
        email,
        name,
        role: 'admin',
        academy_id: academyId,
      })
      .eq('id', userId);

    if (userErr) return { error: userErr.message, profile: null };
  } else {
    const { error: userErr } = await supabase
      .from('users')
      .update({
        email,
        name,
        role: toDbRole(params.role),
        academy_id: null,
      })
      .eq('id', userId);

    if (userErr) return { error: userErr.message, profile: null };
  }

  const profile = await fetchUserProfile(userId);
  return { profile, error: profile ? null : '프로필을 불러오지 못했습니다.' };
}

/** 이메일 가입 시 트리거가 프로필을 만들지 않도록 pending 메타만 설정 */
export function pendingSignupMetadata(name: string, academyName?: string) {
  return {
    name: name.trim(),
    academy_name: academyName?.trim() || null,
    profile_setup: PROFILE_SETUP_PENDING,
  };
}
