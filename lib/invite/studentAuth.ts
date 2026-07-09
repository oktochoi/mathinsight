const LOGIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeLoginCode(raw: string): string {
  const compact = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return raw.trim().toUpperCase();
}

export function studentSyntheticEmail(loginCode: string): string {
  const norm = normalizeLoginCode(loginCode).replace(/-/g, '').toLowerCase();
  return `${norm}@student.eduflow.internal`;
}

export function generateInitialPin(length = 4): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += String(Math.floor(Math.random() * 10));
  }
  return pin;
}

export function isValidPersonalPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export { LOGIN_CODE_CHARS };
