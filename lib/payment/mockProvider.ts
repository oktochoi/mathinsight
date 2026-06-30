import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { PaymentProvider, PlanId } from './types';
import { PLAN_PRICE_KRW } from './types';

export class MockPaymentProvider implements PaymentProvider {
  async subscribe({ academyId, plan }: { academyId: string; plan: PlanId }) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: sub, error: subErr } = await supabaseAdmin()
      .from('academy_subscriptions')
      .update({
        status: 'active',
        plan,
        payment_provider: 'mock',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('academy_id', academyId)
      .select('id')
      .maybeSingle();

    if (subErr) return { ok: false, error: subErr.message };

    const { error: payErr } = await supabaseAdmin().from('subscription_payments').insert({
      academy_id: academyId,
      subscription_id: sub?.id ?? null,
      plan,
      amount_krw: PLAN_PRICE_KRW[plan],
      status: 'success',
      provider: 'mock',
      external_payment_id: `mock_${Date.now()}`,
    });

    if (payErr) return { ok: false, error: payErr.message };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Payment Mock] ${academyId} → ${plan} 구독 활성화`);
    }
    return { ok: true };
  }

  async cancel(academyId: string) {
    const { error } = await supabaseAdmin()
      .from('academy_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('academy_id', academyId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
}
