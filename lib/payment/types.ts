export type PlanId = 'starter' | 'growth' | 'pro';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'expired'
  | 'canceled';

export type SubscriptionPlan = 'free' | PlanId;

export const PLAN_PRICE_KRW: Record<PlanId, number> = {
  starter: 39000,
  growth: 79000,
  pro: 149000,
};

export const PLAN_LABEL: Record<PlanId, string> = {
  starter: '스타터',
  growth: '성장',
  pro: '프로',
};

export const PLAN_STUDENT_LIMIT: Record<PlanId, string> = {
  starter: '50명',
  growth: '150명',
  pro: '무제한',
};

export interface PaymentProvider {
  subscribe(params: {
    academyId: string;
    plan: PlanId;
  }): Promise<{ ok: boolean; error?: string; redirectUrl?: string }>;

  cancel(academyId: string): Promise<{ ok: boolean; error?: string }>;
}
