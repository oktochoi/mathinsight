-- SMS 인증번호 저장 (Mock / Solapi 공용)

CREATE TABLE IF NOT EXISTS public.phone_verifications (
  phone text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_verifications_expires_idx
  ON public.phone_verifications (expires_at);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- 클라이언트 직접 접근 금지 (API + service role만)
COMMENT ON TABLE public.phone_verifications IS 'SMS 인증 — 서버 API 전용';
