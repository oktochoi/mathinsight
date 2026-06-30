-- EduFlow 구독 (Mock 우선, Provider 교체 가능)

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'trialing',
    'active',
    'past_due',
    'expired',
    'canceled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM (
    'free',
    'starter',
    'growth',
    'pro'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  plan public.subscription_plan NOT NULL DEFAULT 'starter',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_provider text NOT NULL DEFAULT 'mock',
  external_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_subscriptions_academy_id_key UNIQUE (academy_id)
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.academy_subscriptions(id) ON DELETE SET NULL,
  plan public.subscription_plan NOT NULL,
  amount_krw integer NOT NULL,
  status text NOT NULL,
  provider text NOT NULL DEFAULT 'mock',
  external_payment_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_payments_academy_idx
  ON public.subscription_payments (academy_id, created_at DESC);

ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academy_sub_read" ON public.academy_subscriptions;
CREATE POLICY "academy_sub_read" ON public.academy_subscriptions
  FOR SELECT
  USING (
    academy_id IN (
      SELECT u.academy_id FROM public.users u WHERE u.id = auth.uid() AND u.academy_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "payment_read" ON public.subscription_payments;
CREATE POLICY "payment_read" ON public.subscription_payments
  FOR SELECT
  USING (
    academy_id IN (
      SELECT u.academy_id FROM public.users u WHERE u.id = auth.uid() AND u.academy_id IS NOT NULL
    )
  );

-- 기존 학원에 3일 체험 부여 (없는 경우만)
INSERT INTO public.academy_subscriptions (
  academy_id,
  status,
  plan,
  trial_started_at,
  trial_ends_at,
  payment_provider
)
SELECT
  a.id,
  'trialing',
  'starter',
  now(),
  now() + interval '3 days',
  'mock'
FROM public.academies a
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_subscriptions s WHERE s.academy_id = a.id
);

COMMENT ON TABLE public.academy_subscriptions IS '학원별 EduFlow SaaS 구독 상태';
