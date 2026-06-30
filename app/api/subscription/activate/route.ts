import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { paymentProvider } from '@/lib/payment';
import { fromDbRole } from '@/lib/roles';
import type { PlanId } from '@/lib/payment/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: PlanId };
    if (!plan || !['starter', 'growth', 'pro'].includes(plan)) {
      return NextResponse.json({ error: '플랜을 선택해 주세요.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('academy_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.academy_id || fromDbRole(profile.role) !== 'owner') {
      return NextResponse.json({ error: '원장만 결제할 수 있습니다.' }, { status: 403 });
    }

    const result = await paymentProvider.subscribe({
      academyId: profile.academy_id,
      plan,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? '결제 실패' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, redirectUrl: result.redirectUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
