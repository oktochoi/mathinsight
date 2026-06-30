const STORAGE_KEY = 'eduflow_pending_academy_code';

export function savePendingAcademyCode(code: string): void {
  if (typeof window === 'undefined') return;
  const normalized = code.trim().toUpperCase();
  if (normalized) sessionStorage.setItem(STORAGE_KEY, normalized);
}

export function peekPendingAcademyCode(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) ?? '';
}

export function clearPendingAcademyCode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
