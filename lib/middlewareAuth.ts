import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasAssignedDbRole } from '@/lib/authProfileSetup';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { resolvePostLoginPath } from '@/lib/authRedirect';
import { normalizeUserProfile } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

export function isAuthGatePath(path: string): boolean {
  return path === '/auth' || path === '/auth/choose-role';
}

export async function readUserDbRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: UserProfile | null; rawDbRole: string | null }> {
  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!data) return { profile: null, rawDbRole: null };
  return {
    profile: normalizeUserProfile(data as UserProfile),
    rawDbRole: data.role as string,
  };
}

/**
 * /auth · /auth/choose-role — 역할 있으면 홈으로, 없으면 choose-role만 허용
 * @returns redirect pathname or null (통과)
 */
export function authGateRedirect(
  path: string,
  user: User,
  profile: UserProfile | null,
  rawDbRole: string | null,
  nextParam: string | null
): string | null {
  const hasRole = hasAssignedDbRole(rawDbRole);

  if (path === '/auth/choose-role') {
    if (!hasRole) return null;
    return postAuthDestination(user, profile, rawDbRole);
  }

  if (path === '/auth') {
    if (!hasRole) return '/auth/choose-role';
    return resolvePostLoginPath(user, profile, nextParam, rawDbRole);
  }

  return null;
}
