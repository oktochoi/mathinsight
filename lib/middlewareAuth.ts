import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { hasAssignedDbRole } from '@/lib/authProfileSetup';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { resolvePostLoginPath } from '@/lib/authRedirect';
import { resolveUserRoleState } from '@/lib/resolveUserRole';
import { AUTH_ROUTES, isAuthEntryPath } from '@/lib/authRoutes';
import type { UserProfile } from '@/types/database';

export function isAuthGatePath(path: string): boolean {
  return isAuthEntryPath(path) || path === AUTH_ROUTES.chooseRole;
}

export async function readUserDbRole(
  supabase: SupabaseClient,
  userId: string,
  user?: User
): Promise<{ profile: UserProfile | null; rawDbRole: string | null }> {
  if (user) {
    const state = await resolveUserRoleState(supabase, user, { syncMetadata: false });
    return { profile: state.profile, rawDbRole: state.rawDbRole };
  }

  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!data) return { profile: null, rawDbRole: null };
  return {
    profile: data as UserProfile,
    rawDbRole: (data.role as string) ?? null,
  };
}

/**
 * Auth 공개 페이지 — 로그인 시 choose-role 또는 앱 홈으로
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

  if (path === AUTH_ROUTES.chooseRole) {
    if (!hasRole) return null;
    return postAuthDestination(user, profile, rawDbRole);
  }

  if (isAuthEntryPath(path)) {
    if (!hasRole) return AUTH_ROUTES.chooseRole;
    return resolvePostLoginPath(user, profile, nextParam, rawDbRole);
  }

  return null;
}
