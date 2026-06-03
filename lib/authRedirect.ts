import type { User } from '@supabase/supabase-js';
import { postAuthDestination } from '@/lib/authRedirectPolicy';
import { fromDbRole, isStaffRole } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

function postAuthHome(
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null
): string {
  return postAuthDestination(user, profile, rawDbRole);
}

const STAFF_PATH_PREFIXES = [
  '/dashboard',
  '/schedule',
  '/students',
  '/lesson-logs',
  '/consultation-cards',
  '/parent-reports',
  '/analytics',
  '/settings',
];

function pathMatchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function effectiveRole(
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null
): string | null {
  return profile?.role ?? fromDbRole(user.user_metadata?.role as string) ?? null;
}

/**
 * 로그인·OAuth 직후 이동 경로.
 * `?next=/parent` 등 역할과 맞지 않는 next 는 무시하고 홈으로 보냅니다.
 */
export function resolvePostLoginPath(
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  next?: string | null,
  rawDbRole?: string | null
): string {
  const home = postAuthHome(user, profile, rawDbRole);
  if (!next || !next.startsWith('/')) return home;

  const pathname = next.split('?')[0];
  if (!pathname.startsWith('/')) return home;

  const role = rawDbRole ? fromDbRole(rawDbRole) : effectiveRole(user, profile);
  if (!role) return home;

  if (isStaffRole(role)) {
    return pathMatchesPrefix(pathname, STAFF_PATH_PREFIXES) ? next : home;
  }
  if (role === 'parent') {
    return pathname === '/parent' || pathname.startsWith('/parent/') ? next : home;
  }
  if (role === 'student') {
    return pathname === '/student' || pathname.startsWith('/student/') ? next : home;
  }

  return home;
}
