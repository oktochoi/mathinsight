import { fromDbRole, isStaffRole } from '@/lib/roles';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import type { UserProfile } from '@/types/database';
import { checkAcademySubscription } from './guard';

const STAFF_PREFIXES = [
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
  '/classes',
  '/parent-hub',
  '/workflow',
  '/ai',
  '/customers',
];

export async function subscriptionRedirectPath(
  path: string,
  profile: UserProfile | null,
  rawDbRole?: string | null
): Promise<string | null> {
  if (path === '/subscribe' || path.startsWith('/subscribe/')) return null;
  if (path === '/onboarding' || path.startsWith('/onboarding/')) return null;

  const appRole = fromDbRole(rawDbRole ?? undefined) ?? profile?.role;
  if (!appRole || !isStaffRole(appRole)) return null;
  if (!profile?.academy_id) return null;

  if (PROMO_ALL_FREE.active) return null;

  const onStaffApp = STAFF_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!onStaffApp) return null;

  const result = await checkAcademySubscription(profile.academy_id);
  if (!result.allowed) {
    return `/subscribe?reason=${result.reason}`;
  }
  return null;
}

export { checkAcademySubscription } from './guard';
export { createTrialSubscription, expireTrialNow } from './trialService';
