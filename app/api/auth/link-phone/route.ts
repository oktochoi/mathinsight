import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { smsProvider } from '@/lib/sms';
import { toSmsApiError } from '@/lib/sms/apiErrors';
import { isValidPhoneKr, normalizePhoneKr, phoneToAuthEmail } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await req.json()) as { phone?: string; code?: string };
    const phone = normalizePhoneKr(body.phone ?? '');
    const code = (body.code ?? '').trim();

    if (!isValidPhoneKr(phone)) {
      return NextResponse.json({ ok: false, error: '올바른 휴대폰 번호를 입력해 주세요.' }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ ok: false, error: '인증번호를 입력해 주세요.' }, { status: 400 });
    }

    const verify = await smsProvider.verify(phone, code);
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.error ?? '인증 실패' }, { status: 400 });
    }

    const phoneEmail = phoneToAuthEmail(phone);
    if (user.email && user.email !== phoneEmail) {
      const { data: conflict } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .neq('id', user.id)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { ok: false, error: '이미 다른 계정에 등록된 휴대폰 번호입니다.' },
          { status: 409 }
        );
      }
    }

    const { error: updateErr } = await supabase.from('users').update({ phone }).eq('id', user.id);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    await supabase.auth.updateUser({
      data: {
        phone,
        phone_verified: true,
      },
    });

    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    const { message, status } = toSmsApiError(e);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
