import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PHONE_RE = /^01[0-9]{8,9}$/;

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('82') && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }
  if (PHONE_RE.test(digits)) return digits;
  return null;
}

export async function resolveNotificationPhone(input: {
  recipientLabel: string;
  studentId?: string | null;
}): Promise<string | null> {
  const fromLabel = normalizePhone(input.recipientLabel);
  if (fromLabel) return fromLabel;

  if (!input.studentId) return null;

  const { data } = await supabaseAdmin()
    .from('students')
    .select('parent_phone')
    .eq('id', input.studentId)
    .maybeSingle();

  if (!data?.parent_phone) return null;
  return normalizePhone(data.parent_phone);
}
