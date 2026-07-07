-- 마케팅 문의 폼 저장

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  academy text,
  inquiry_type text NOT NULL DEFAULT 'other',
  body text NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_inquiries_created_idx
  ON public.contact_inquiries (created_at DESC);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.contact_inquiries IS '마케팅 사이트 문의 폼 (service role insert)';
