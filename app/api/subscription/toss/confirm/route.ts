import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { fromDbRole } from '@/lib/roles';
import { confirmTossPayment } from '@/lib/payment/tossApi';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { PlanId } from '@/lib/payment/types';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인 필요' }, { status: 401 });
    }

    const body = (await request.json()) as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    if (!body.paymentKey || !body.orderId || body.amount == null) {
      return NextResponse.json({ ok: false, error: '결제 정보가 부족합니다.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('academy_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.academy_id || fromDbRole(profile.role) !== 'owner') {
      return NextResponse.json({ ok: false, error: '원장만 결제할 수 있습니다.' }, { status: 403 });
    }

    const { data: pending } = await supabaseAdmin()
      .from('subscription_payments')
      .select('id, academy_id, plan, amount_krw, status')
      .eq('external_payment_id', body.orderId)
      .eq('academy_id', profile.academy_id)
      .maybeSingle();

    if (!pending || pending.status !== 'pending') {
      return NextResponse.json({ ok: false, error: '유효하지 않은 주문입니다.' }, { status: 400 });
    }

    if (pending.amount_krw !== body.amount) {
      return NextResponse.json({ ok: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
    }

    const confirmed = await confirmTossPayment({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    });

    if (!confirmed.ok) {
      return NextResponse.json({ ok: false, error: confirmed.error }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const plan = pending.plan as PlanId;

    await supabaseAdmin()
      .from('subscription_payments')
      .update({
        status: 'success',
        paid_at: now.toISOString(),
      })
      .eq('id', pending.id);

    await supabaseAdmin()
      .from('academy_subscriptions')
      .update({
        status: 'active',
        plan,
        payment_provider: 'toss',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('academy_id', profile.academy_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
