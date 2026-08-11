/** 한국 휴대폰 번호 정규화 — DB `normalize_phone_kr`와 동일 규칙 */

export function normalizePhoneKr(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 && digits.startsWith('10')) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith('010')) return digits;
  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhoneKr(phone);
  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  return phone;
}

export function isValidPhoneKr(raw: string): boolean {
  const d = normalizePhoneKr(raw);
  return d.length === 11 && d.startsWith('010');
}

/** Supabase Auth용 내부 이메일 (실제 SMS 연동 전) */
export function phoneToAuthEmail(phone: string): string {
  return `${normalizePhoneKr(phone)}@phone.eduflow.local`;
}

/** 로그인 아이디 → Supabase Auth 이메일.
 * 이메일 통일이 기본. 레거시 휴대폰 계정(@phone.eduflow.local)만 하위 호환. */
export function resolveLoginEmail(loginId: string): string {
  const trimmed = loginId.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  if (isValidPhoneKr(trimmed)) return phoneToAuthEmail(trimmed);
  return trimmed.toLowerCase();
}
