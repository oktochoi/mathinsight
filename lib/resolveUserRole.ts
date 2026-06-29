import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  hasAssignedDbRole,
  PROFILE_SETUP_COMPLETE,
  shouldSyncMetadataFromProfile,
  syncAuthMetadataFromProfile,
} from '@/lib/authProfileSetup';
import { fromDbRole, normalizeUserProfile, toDbRole } from '@/lib/roles';
import { repairProfileRole } from '@/lib/profileIntegrity';
import type { UserProfile } from '@/types/database';

/**
 * DB role · metadata · academy owner 기준으로 역할 상태 해석.
 * 로그인·proxy·서버 컴포넌트 공통.
 */
export async function resolveUserRoleState(
  supabase: SupabaseClient,
  user: User,
  options?: { syncMetadata?: boolean }
): Promise<{ profile: UserProfile | null; rawDbRole: string | null; needsChooseRole: boolean }> {
  const { data: row } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  let profile = row ? normalizeUserProfile(row as UserProfile) : null;

  profile = await repairProfileRole(
    user.id,
    profile,
    user.user_metadata as Record<string, unknown>,
    supabase,
    { syncAuthMetadata: options?.syncMetadata ?? false }
  );

  let rawDbRole = await readDbRole(supabase, user.id);

  if (!hasAssignedDbRole(rawDbRole)) {
    rawDbRole = await repairFromMetadata(supabase, user, profile);
    if (rawDbRole) {
      const { data: refreshed } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (refreshed) profile = normalizeUserProfile(refreshed as UserProfile);
    }
  }

  if (!hasAssignedDbRole(rawDbRole)) {
    const repaired = await repairAcademyOwnerRow(supabase, user, profile);
    rawDbRole = repaired.rawDbRole;
    profile = repaired.profile ?? profile;
  }

  if (profile && rawDbRole && options?.syncMetadata) {
    if (shouldSyncMetadataFromProfile(user, profile, rawDbRole)) {
      const displayName =
        profile.name ||
        (user.user_metadata?.name as string | undefined)?.trim() ||
        user.email?.split('@')[0] ||
        '사용자';
      await syncAuthMetadataFromProfile(profile, displayName, rawDbRole, supabase);
    }
  }

  return {
    profile,
    rawDbRole,
    needsChooseRole: !hasAssignedDbRole(rawDbRole),
  };
}

async function readDbRole(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
  return (data?.role as string | null) ?? null;
}

async function repairFromMetadata(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfile | null
): Promise<string | null> {
  const metaRole = user.user_metadata?.role as string | undefined;
  const setup = user.user_metadata?.profile_setup as string | undefined;
  if (setup !== PROFILE_SETUP_COMPLETE || !metaRole) return null;

  const appRole = fromDbRole(metaRole);
  if (!appRole) return null;

  const dbRole = toDbRole(appRole);
  if (!profile) return null;

  const { error } = await supabase.from('users').update({ role: dbRole }).eq('id', user.id);
  return error ? null : dbRole;
}

async function repairAcademyOwnerRow(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfile | null
): Promise<{ profile: UserProfile | null; rawDbRole: string | null }> {
  const { data: owned } = await supabase
    .from('academies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!owned?.id) return { profile, rawDbRole: null };

  const dbRole = toDbRole('owner');
  const name =
    profile?.name ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    '사용자';

  if (profile) {
    await supabase
      .from('users')
      .update({ role: dbRole, academy_id: owned.id })
      .eq('id', user.id);
  } else {
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email ?? '',
      name,
      role: dbRole,
      academy_id: owned.id,
    });
  }

  const { data: refreshed } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
  return {
    profile: refreshed ? normalizeUserProfile(refreshed as UserProfile) : profile,
    rawDbRole: dbRole,
  };
}
