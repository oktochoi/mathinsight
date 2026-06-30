-- EduFlow: 휴대폰 + 학원 코드 기반 포털 연결
-- 실제 SMS 미연동 — 인증은 클라이언트 Mock

-- ---------------------------------------------------------------------------
-- 휴대폰 정규화 (한국 010xxxxxxxx)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone_kr(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  d text;
BEGIN
  d := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF d = '' THEN
    RETURN '';
  END IF;
  IF length(d) = 10 AND d LIKE '10%' THEN
    d := '0' || d;
  END IF;
  IF length(d) = 11 AND d LIKE '010%' THEN
    RETURN d;
  END IF;
  RETURN d;
END;
$$;

-- ---------------------------------------------------------------------------
-- 학원 공개 코드 (예: HAN823) — connection_code(EDU-XXXX-XX)와 별도
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_academy_public_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  i int;
BEGIN
  FOR attempt IN 1..80 LOOP
    code := '';
    FOR i IN 1..3 LOOP
      code := code || substr(letters, 1 + floor(random() * length(letters))::int, 1);
    END LOOP;
    code := code || lpad((floor(random() * 900) + 100)::text, 3, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.academies a WHERE upper(a.academy_code) = code
    );
  END LOOP;
  IF code IS NULL OR EXISTS (SELECT 1 FROM public.academies a WHERE upper(a.academy_code) = code) THEN
    RAISE EXCEPTION 'academy_public_code_generation_failed';
  END IF;
  RETURN code;
END;
$$;

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS academy_code text;

CREATE UNIQUE INDEX IF NOT EXISTS academies_academy_code_key
  ON public.academies (upper(academy_code))
  WHERE academy_code IS NOT NULL;

UPDATE public.academies
SET academy_code = public.generate_academy_public_code()
WHERE academy_code IS NULL;

CREATE OR REPLACE FUNCTION public.academies_set_public_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.academy_code IS NULL OR trim(new.academy_code) = '' THEN
    new.academy_code := public.generate_academy_public_code();
  ELSE
    new.academy_code := upper(trim(new.academy_code));
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS academies_public_code_before_insert ON public.academies;
CREATE TRIGGER academies_public_code_before_insert
  BEFORE INSERT ON public.academies
  FOR EACH ROW
  WHEN (new.academy_code IS NULL OR trim(new.academy_code) = '')
  EXECUTE FUNCTION public.academies_set_public_code();

-- ---------------------------------------------------------------------------
-- 학생 휴대폰
-- ---------------------------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX IF NOT EXISTS students_academy_phone_idx
  ON public.students (academy_id, public.normalize_phone_kr(phone))
  WHERE phone IS NOT NULL AND trim(phone) <> '';

CREATE INDEX IF NOT EXISTS parents_academy_phone_idx
  ON public.parents (academy_id, public.normalize_phone_kr(phone))
  WHERE phone IS NOT NULL AND trim(phone) <> '';

-- ---------------------------------------------------------------------------
-- 학원 코드 조회 (academy_code 우선, connection_code 호환)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_academy_by_public_code(p_code text)
RETURNS TABLE (id uuid, name text, academy_code text, connection_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name, a.academy_code, a.connection_code
  FROM public.academies a
  WHERE upper(trim(coalesce(p_code, ''))) <> ''
    AND (
      upper(trim(a.academy_code)) = upper(trim(p_code))
      OR public.connection_code_lookup_key(a.connection_code)
         = public.connection_code_lookup_key(p_code)
    )
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 포털 연결 미리보기 (인증 필요)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preview_portal_link(
  p_academy_code text,
  p_phone text,
  p_mode text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_phone text := public.normalize_phone_kr(p_phone);
  v_academy_id uuid;
  v_academy_name text;
  v_academy_code text;
  v_matches jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF v_phone = '' OR length(v_phone) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone');
  END IF;
  IF p_mode NOT IN ('student', 'parent') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_mode');
  END IF;

  SELECT a.id, a.name, a.academy_code
  INTO v_academy_id, v_academy_name, v_academy_code
  FROM public.resolve_academy_by_public_code(p_academy_code) a;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF p_mode = 'student' THEN
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.name), '[]'::jsonb)
    INTO v_matches
    FROM (
      SELECT
        s.id AS student_id,
        s.name,
        s.grade,
        s.school,
        c.name AS class_name
      FROM public.students s
      LEFT JOIN public.classes c ON c.id = s.class_id
      WHERE s.academy_id = v_academy_id
        AND public.normalize_phone_kr(s.phone) = v_phone
        AND s.enrollment_status IN ('active', 'on_leave', 'prospect')
    ) t;
  ELSE
    SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.student_name), '[]'::jsonb)
    INTO v_matches
    FROM (
      SELECT DISTINCT
        s.id AS student_id,
        s.name AS student_name,
        s.grade,
        c.name AS class_name,
        p.name AS parent_name,
        psl.relationship
      FROM public.parents p
      JOIN public.parent_student_links psl ON psl.parent_id = p.id
      JOIN public.students s ON s.id = psl.student_id
      LEFT JOIN public.classes c ON c.id = s.class_id
      WHERE p.academy_id = v_academy_id
        AND public.normalize_phone_kr(p.phone) = v_phone
        AND s.enrollment_status IN ('active', 'on_leave', 'prospect')
    ) t;
  END IF;

  IF jsonb_array_length(v_matches) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'no_match',
      'detail', '등록된 번호와 일치하는 정보가 없습니다. 학원에 문의해 주세요.'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'academy_id', v_academy_id,
    'academy_name', v_academy_name,
    'academy_code', v_academy_code,
    'phone', v_phone,
    'mode', p_mode,
    'matches', v_matches
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 포털 연결 확정 (사용자 확인 후)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_portal_link(
  p_academy_code text,
  p_phone text,
  p_mode text,
  p_student_id uuid DEFAULT NULL,
  p_relationship text DEFAULT 'guardian'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_phone text := public.normalize_phone_kr(p_phone);
  v_academy_id uuid;
  v_student_id uuid;
  v_parent_id uuid;
  v_rel text;
  v_child record;
  v_linked int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_uid;

  IF p_mode = 'student' AND v_role <> 'student' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'student_role_required');
  END IF;
  IF p_mode = 'parent' AND v_role <> 'parent' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'parent_role_required');
  END IF;

  SELECT a.id INTO v_academy_id
  FROM public.resolve_academy_by_public_code(p_academy_code) a;
  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  UPDATE public.users
  SET phone = v_phone, academy_id = v_academy_id
  WHERE id = v_uid;

  IF p_mode = 'student' THEN
    SELECT s.id INTO v_student_id
    FROM public.students s
    WHERE s.id = p_student_id
      AND s.academy_id = v_academy_id
      AND public.normalize_phone_kr(s.phone) = v_phone;

    IF v_student_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'student_not_found');
    END IF;

    INSERT INTO public.student_connections (student_id, user_id, relationship)
    VALUES (v_student_id, v_uid, 'student')
    ON CONFLICT (student_id, user_id) DO UPDATE SET relationship = 'student';

    RETURN jsonb_build_object('ok', true, 'student_id', v_student_id, 'linked_count', 1);
  END IF;

  v_rel := CASE
    WHEN p_relationship IN ('mother', 'father', 'guardian') THEN p_relationship
    ELSE 'guardian'
  END;

  FOR v_child IN
    SELECT DISTINCT s.id AS student_id, p.id AS parent_id
    FROM public.parents p
    JOIN public.parent_student_links psl ON psl.parent_id = p.id
    JOIN public.students s ON s.id = psl.student_id
    WHERE p.academy_id = v_academy_id
      AND public.normalize_phone_kr(p.phone) = v_phone
      AND s.enrollment_status IN ('active', 'on_leave', 'prospect')
  LOOP
    UPDATE public.parents SET user_id = v_uid WHERE id = v_child.parent_id;

    INSERT INTO public.student_connections (student_id, user_id, relationship)
    VALUES (v_child.student_id, v_uid, v_rel)
    ON CONFLICT (student_id, user_id) DO UPDATE SET relationship = v_rel;

    v_linked := v_linked + 1;
  END LOOP;

  IF v_linked = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_match');
  END IF;

  RETURN jsonb_build_object('ok', true, 'linked_count', v_linked);
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
  UPDATE public.academies SET academy_code = v_code WHERE id = p_academy_id;
  RETURN jsonb_build_object('ok', true, 'academy_code', v_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_phone_kr(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_academy_by_public_code(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.preview_portal_link(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_portal_link(text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_academy_public_code(uuid) TO authenticated;
