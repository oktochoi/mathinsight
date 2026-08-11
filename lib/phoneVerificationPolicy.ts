import type { UserProfile } from '@/types/database';

/**
 * 이메일 로그인 통일 — 휴대폰 OTP 강제 인증을 요구하지 않는다.
 * (레거시 휴대폰 가입 계정은 그대로 로그인 가능, 신규는 이메일/초대)
 */
export function profileHasVerifiedPhone(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile?.phone?.trim());
}

export function needsPhoneVerification(_profile: UserProfile | null | undefined): boolean {
  return false;
}
