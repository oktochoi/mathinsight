import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPersonalPin, normalizeLoginCode, studentSyntheticEmail } from '@/lib/invite/studentAuth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as { loginCode?: string; newPin?: string };
    const newPin = (body.newPin ?? '').trim();
    const loginCode = normalizeLoginCode(body.loginCode ?? '');

    if (!isValidPersonalPin(newPin)) {
      return NextResponse.json({ ok: false, error: 'PIN은 6자리 숫자여야 합니다.' }, { status: 400 });
    }

    const email = studentSyntheticEmail(loginCode);
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const admin = supabaseAdmin();
    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPin,
    });

    if (authErr) {
      return NextResponse.json({ ok: false, error: authErr.message }, { status: 400 });
    }

    const { data: st } = await admin
      .from('students')
      .select('id')
      .eq('login_code', loginCode)
      .maybeSingle();

    if (st?.id) {
      await admin.rpc('mark_student_pin_reset_done', { p_student_id: st.id });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
