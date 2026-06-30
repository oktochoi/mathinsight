/**
 * SMS 인증 — 클라이언트 세션 보조 + 레거시 호환
 * 실제 발송/검증은 /api/sms/* + lib/sms Provider
 */

import { MOCK_SMS_CODE } from '@/lib/sms';

export { MOCK_SMS_CODE };

export type PhoneVerificationState = {
  phone: string;
  verified: boolean;
  verifiedAt: number;
};

const SESSION_KEY = 'eduflow_phone_verified';

export function readVerifiedPhone(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhoneVerificationState;
    if (!parsed.verified || Date.now() - parsed.verifiedAt > 30 * 60 * 1000) return null;
    return parsed.phone;
  } catch {
    return null;
  }
}

export function clearVerifiedPhone() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
