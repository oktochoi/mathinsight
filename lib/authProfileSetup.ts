import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fromDbRole } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

export const PROFILE_SETUP_PENDING = 'pending';
export const PROFILE_SETUP_COMPLETE = 'complete';

/** `public.users.role` 이 DB에 저장됐는지 (null·빈 문자열만 미할당) */
export function hasAssignedDbRole(rawDbRole: string | null | undefined): boolean {
  const r = rawDbRole?.trim();
  return !!r;
}

/**
 * 역할 선택(/auth/choose-role) — DB role 이 null 일 때만
 * admin·parent·teacher·student 모두 할당된 역할로 간주
 */
export function needsProfileSetup(
  _user?: unknown,
  _profile?: UserProfile | null,
  rawDbRole?: string | null
): boolean {
  return !hasAssignedDbRole(rawDbRole);
}

export function shouldSyncMetadataFromProfile(
  user: { user_metadata?: { profile_setup?: string } },
  profile: UserProfile | null,
  rawDbRole?: string | null
): boolean {
  if (!hasAssignedDbRole(rawDbRole)) return false;
  if (user.user_metadata?.profile_setup === PROFILE_SETUP_COMPLETE) return false;
  return true;
}

export async function syncAuthMetadataFromProfile(
  profile: UserProfile,
  displayName: string,
  rawDbRole: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const appRole = fromDbRole(rawDbRole) ?? profile.role;
  await client.auth.updateUser({
    data: {
      profile_setup: PROFILE_SETUP_COMPLETE,
      name: profile.name?.trim() || displayName,
      role: appRole,
      academy_name: null,
    },
  });
}
