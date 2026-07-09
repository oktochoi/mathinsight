import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { fetchActiveWorkspaces, applyWorkspaceContext } from '@/lib/workspace/memberships';
import { resolveWorkspaceDestination } from '@/lib/workspace/redirect';
import { homeForMembershipRole } from '@/lib/workspace/types';
import { WORKSPACE_COOKIE } from '@/lib/workspace/types';
import type { UserProfile } from '@/types/database';

/**
 * 로그인·OAuth 직후 — academy_memberships 기준 워크스페이스 라우팅
 */
export async function resolvePostAuthWithWorkspaces(
  supabase: SupabaseClient,
  user: Pick<User, 'id' | 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null,
  next?: string | null,
  workspaceCookieId?: string | null
): Promise<string> {
  const base = postAuthDestination(user, profile, rawDbRole);
  if (base.startsWith('/auth') || base === '/onboarding') {
    return base;
  }

  const memberships = await fetchActiveWorkspaces(supabase, user.id);
  if (memberships.length === 0) {
    return base;
  }

  if (workspaceCookieId) {
    const picked = memberships.find((m) => m.id === workspaceCookieId);
    if (picked) {
      await applyWorkspaceContext(supabase, user.id, picked);
      return homeForMembershipRole(picked.role);
    }
  }

  const dest = resolveWorkspaceDestination(memberships);
  if (typeof dest === 'string') {
    if (memberships.length === 1) {
      await applyWorkspaceContext(supabase, user.id, memberships[0]);
    }
    return dest;
  }

  return dest.path;
}

export { WORKSPACE_COOKIE };
