import { createAdminClient } from '@/lib/supabase/admin';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

export type GuardResult =
  | { allowed: true; status: 'trialing' | 'active'; daysLeft?: number }
  | {
      allowed: false;
      reason: 'trial_expired' | 'expired' | 'past_due' | 'canceled' | 'no_subscription';
    };

export async function checkAcademySubscription(academyId: string): Promise<GuardResult> {
  if (PROMO_ALL_FREE.active) {
    return { allowed: true, status: 'active' };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { allowed: true, status: 'trialing', daysLeft: 3 };
  }

  const { data } = await admin
    .from('academy_subscriptions')
    .select('status, trial_ends_at, current_period_end')
    .eq('academy_id', academyId)
    .maybeSingle();

  if (!data) return { allowed: false, reason: 'no_subscription' };

  if (data.status === 'active') {
    const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
    if (periodEnd && periodEnd <= new Date()) {
      return { allowed: false, reason: 'expired' };
    }
    return { allowed: true, status: 'active' };
  }

  if (data.status === 'trialing') {
    const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    if (!trialEnd) return { allowed: false, reason: 'trial_expired' };
    const now = new Date();
    if (trialEnd > now) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { allowed: true, status: 'trialing', daysLeft };
    }
    return { allowed: false, reason: 'trial_expired' };
  }

  if (data.status === 'past_due') return { allowed: false, reason: 'past_due' };
  if (data.status === 'canceled') return { allowed: false, reason: 'canceled' };
  return { allowed: false, reason: 'expired' };
}
