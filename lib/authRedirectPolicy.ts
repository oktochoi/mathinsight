import type { User } from '@supabase/supabase-js';
import { hasAssignedDbRole, needsProfileSetup } from '@/lib/authProfileSetup';
import { fromDbRole, isStaffRole, roleHomePath } from '@/lib/roles';
import type { UserProfile } from '@/types/database';

const staffPrefixes = [
  '/dashboard',
  '/schedule',
  '/students',
  '/lesson-logs',
  '/consultation-cards',
  '/parent-reports',
  '/analytics',
  '/settings',
];

export function isProtectedAppPath(path: string): boolean {
  return (
    staffPrefixes.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path === '/parent' ||
    path.startsWith('/parent/') ||
    path === '/student' ||
    path.startsWith('/student/')
  );
}

export function portalRedirectForProtectedPath(
  path: string,
  _user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null
): string | null {
  if (needsProfileSetup(undefined, profile, rawDbRole)) {
    return '/auth/choose-role';
  }

  const appRole = fromDbRole(rawDbRole!) ?? profile?.role;
  if (!appRole) return '/auth/choose-role';

  const onStaffApp = staffPrefixes.some((p) => path.startsWith(p));
  const onParent = path === '/parent' || path.startsWith('/parent/');
  const onStudent = path === '/student' || path.startsWith('/student/');

  if (isStaffRole(appRole) && (onParent || onStudent)) {
    return '/dashboard';
  }
  if (appRole === 'parent' && (onStaffApp || onStudent)) {
    return '/parent';
  }
  if (appRole === 'student' && (onStaffApp || onParent)) {
    return '/student';
  }

  return null;
}

export function postAuthDestination(
  _user: Pick<User, 'user_metadata'>,
  _profile: UserProfile | null,
  rawDbRole?: string | null
): string {
  if (!hasAssignedDbRole(rawDbRole)) {
    return '/auth/choose-role';
  }
  return roleHomePath(rawDbRole);
}
