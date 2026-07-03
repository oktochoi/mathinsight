import { isValidPhoneKr, normalizePhoneKr } from '@/lib/phone';
import type { UserProfile } from '@/types/database';

export function profileHasVerifiedPhone(profile: UserProfile | null | undefined): boolean {
  if (!profile?.phone?.trim()) return false;
  return isValidPhoneKr(normalizePhoneKr(profile.phone));
}

export function needsPhoneVerification(profile: UserProfile | null | undefined): boolean {
  return !profileHasVerifiedPhone(profile);
}
