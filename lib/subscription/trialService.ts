import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TRIAL_DAYS = 3;

/** 학원 생성 시 호출 — 3일 체험 구독 생성 */
export async function createTrialSubscription(academyId: string) {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { data: existing } = await supabaseAdmin()
    .from('academy_subscriptions')
    .select('id')
    .eq('academy_id', academyId)
    .maybeSingle();

  if (existing?.id) {
    return { trialEnd, created: false };
  }

  const { error } = await supabaseAdmin().from('academy_subscriptions').insert({
    academy_id: academyId,
    status: 'trialing',
    plan: 'starter',
    trial_started_at: now.toISOString(),
    trial_ends_at: trialEnd.toISOString(),
    payment_provider: 'mock',
  });

  if (error) console.error('[Trial] 생성 실패:', error);
  return { trialEnd, created: !error };
}

/** 개발 환경 전용 — 체험 즉시 만료 */
export async function expireTrialNow(academyId: string) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('production에서 사용 불가');
  }
  const past = new Date(Date.now() - 1000).toISOString();
  await supabaseAdmin()
    .from('academy_subscriptions')
    .update({
      trial_ends_at: past,
      updated_at: new Date().toISOString(),
    })
    .eq('academy_id', academyId);
}
