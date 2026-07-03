import type { User } from '@supabase/supabase-js';
import { hasAssignedDbRole, needsProfileSetup } from '@/lib/authProfileSetup';
import { needsPhoneVerification } from '@/lib/phoneVerificationPolicy';
import { fromDbRole, isStaffRole, roleHomePath, toDbRole } from '@/lib/roles';
import { AUTH_ROUTES } from '@/lib/authRoutes';
import type { UserProfile } from '@/types/database';

/** DB role · 프로필 · metadata 중 할당된 역할 문자열 */
export function resolveDbRole(
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null
): string | null {
  if (hasAssignedDbRole(rawDbRole)) return rawDbRole!.trim();
  if (profile?.role) return toDbRole(profile.role);
  const meta = user.user_metadata?.role as string | undefined;
  if (meta && fromDbRole(meta)) return toDbRole(meta);
  return null;
}

const staffPrefixes = [
  '/dashboard',
  '/schedule',
  '/students',
  '/attendance',
  '/homework',
  '/grades',
  '/counseling',
  '/notices',
  '/messages',
  '/curriculum',
  '/billing',
  '/notifications',
  '/integrations',
  '/retention',
  '/lesson-logs',
  '/consultation-cards',
  '/parent-reports',
  '/analytics',
  '/settings',
];

export function isProtectedAppPath(path: string): boolean {
  return (
    staffPrefixes.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path === '/subscribe' ||
    path.startsWith('/subscribe/') ||
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
    return AUTH_ROUTES.chooseRole;
  }

  if (needsPhoneVerification(profile)) {
    return AUTH_ROUTES.verifyPhone;
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
  user: Pick<User, 'user_metadata'>,
  profile: UserProfile | null,
  rawDbRole?: string | null
): string {
  const dbRole = resolveDbRole(user, profile, rawDbRole);
  if (!hasAssignedDbRole(dbRole)) {
    return AUTH_ROUTES.chooseRole;
  }
  if (needsPhoneVerification(profile)) {
    return AUTH_ROUTES.verifyPhone;
  }
  // 온보딩 미완료 → 온보딩으로 (=== false: undefined는 제외, 기존 유저 영향 없음)
  if (profile?.onboarding_complete === false) {
    return '/onboarding';
  }
  return roleHomePath(dbRole);
}
