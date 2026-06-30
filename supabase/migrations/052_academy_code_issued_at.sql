-- 학원 공개 코드 발급 시각 (설정 화면 유효기간 안내용)

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS academy_code_issued_at timestamptz;

UPDATE public.academies
SET academy_code_issued_at = COALESCE(academy_code_issued_at, created_at, now())
WHERE academy_code_issued_at IS NULL;

CREATE OR REPLACE FUNCTION public.academies_set_public_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.academy_code IS NULL OR trim(new.academy_code) = '' THEN
    new.academy_code := public.generate_academy_public_code();
    new.academy_code_issued_at := now();
  ELSE
    new.academy_code := upper(trim(new.academy_code));
    IF TG_OP = 'INSERT' AND new.academy_code_issued_at IS NULL THEN
      new.academy_code_issued_at := now();
    END IF;
  END IF;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_academy_public_code(p_academy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.academies a
    WHERE a.id = p_academy_id
      AND (a.owner_id = v_uid OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = v_uid AND u.academy_id = p_academy_id AND u.role IN ('owner', 'admin')
      ))
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_code := public.generate_academy_public_code();
  UPDATE public.academies
  SET academy_code = v_code, academy_code_issued_at = now()
  WHERE id = p_academy_id;

  RETURN jsonb_build_object('ok', true, 'academy_code', v_code);
END;
$$;

COMMENT ON COLUMN public.academies.academy_code_issued_at IS '공개 학원 코드(academy_code) 마지막 발급 시각';
