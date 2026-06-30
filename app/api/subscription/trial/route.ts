import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { fromDbRole } from '@/lib/roles';
import { createTrialSubscription } from '@/lib/subscription/trialService';
import { NextResponse } from 'next/server';

export async function POST() {
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
      .select('academy_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.academy_id || fromDbRole(profile.role) !== 'owner') {
      return NextResponse.json({ error: '원장 권한이 필요합니다.' }, { status: 403 });
    }

    const { trialEnd, created } = await createTrialSubscription(profile.academy_id);
    return NextResponse.json({ ok: true, created, trialEndsAt: trialEnd.toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
