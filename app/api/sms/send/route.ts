import { smsProvider } from '@/lib/sms';
import { toSmsApiError } from '@/lib/sms/apiErrors';
import { isValidPhoneKr, normalizePhoneKr } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    const normalized = normalizePhoneKr(phone ?? '');
    if (!isValidPhoneKr(normalized)) {
      return NextResponse.json({ error: '올바른 번호를 입력해 주세요.' }, { status: 400 });
    }
    const result = await smsProvider.send(normalized);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? '발송 실패' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { message, status } = toSmsApiError(e);
    return NextResponse.json({ error: message }, { status });
  }
}
