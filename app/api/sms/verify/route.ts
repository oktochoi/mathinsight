import { smsProvider } from '@/lib/sms';
import { toSmsApiError } from '@/lib/sms/apiErrors';
import { normalizePhoneKr } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone, code } = (await req.json()) as { phone?: string; code?: string };
    const normalized = normalizePhoneKr(phone ?? '');
    const result = await smsProvider.verify(normalized, code ?? '');
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? '인증 실패' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { message, status } = toSmsApiError(e);
    return NextResponse.json({ error: message }, { status });
  }
}
