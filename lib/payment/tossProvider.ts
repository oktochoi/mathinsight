import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { tossConfigured } from './tossApi';
import type { PaymentProvider, PlanId } from './types';
import { PLAN_LABEL, PLAN_PRICE_KRW } from './types';

export class TossProvider implements PaymentProvider {
  async subscribe({ academyId, plan }: { academyId: string; plan: PlanId }) {
    if (!tossConfigured()) {
      return {
        ok: false as const,
        error: 'Toss 키가 설정되지 않았습니다. TOSS_SECRET_KEY, NEXT_PUBLIC_TOSS_CLIENT_KEY를 확인하세요.',
      };
    }

    const orderId = `ef_${academyId.replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
    const amount = PLAN_PRICE_KRW[plan];

    const { data: sub } = await supabaseAdmin()
      .from('academy_subscriptions')
      .select('id')
      .eq('academy_id', academyId)
      .maybeSingle();

    const { error } = await supabaseAdmin().from('subscription_payments').insert({
      academy_id: academyId,
      subscription_id: sub?.id ?? null,
      plan,
      amount_krw: amount,
      status: 'pending',
      provider: 'toss',
      external_payment_id: orderId,
    });

    if (error) return { ok: false as const, error: error.message };

    const params = new URLSearchParams({
      orderId,
      plan,
      amount: String(amount),
      orderName: `EduFlow ${PLAN_LABEL[plan]} 플랜`,
    });

    return { ok: true as const, redirectUrl: `/subscribe/pay?${params.toString()}` };
  }

  async cancel(academyId: string) {
    const { error } = await supabaseAdmin()
      .from('academy_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('academy_id', academyId);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  }
}
