import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { expireTrialNow } from '@/lib/subscription/trialService';
import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('academy_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.academy_id) {
      return NextResponse.json({ error: '학원 정보 없음' }, { status: 400 });
    }

    await expireTrialNow(profile.academy_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
