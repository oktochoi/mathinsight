-- 온보딩 진행 단계 추적
ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone text;

-- 기존 원장은 온보딩 완료(7)로 백필 — 이미 학원 운영 중
UPDATE public.academies
SET onboarding_step = 7
WHERE onboarding_step = 0
  AND EXISTS (
    SELECT 1 FROM public.classes c WHERE c.academy_id = academies.id
  );
