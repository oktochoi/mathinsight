-- 학원 연결 코드 조회·제출 수정
-- 1) 하이픈 없이 입력해도 매칭 (EDUABCD12 → EDU-ABCD-12)
-- 2) 구버전 submit_student_connection_request 오버로드 제거
-- 3) 학생 이름 + 학년으로 자동 매칭 강화
-- 4) join_academy_by_code 정규화 + admin(원장) 허용

-- ---------------------------------------------------------------------------
-- 코드 정규화
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_connection_code_input(p_code text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text;
  m text[];
BEGIN
  v := upper(regexp_replace(trim(coalesce(p_code, '')), '\s+', '', 'g'));
  IF v = '' THEN
    RETURN v;
  END IF;
  IF v ~ '^EDU-[A-Z0-9]{4}-\d{2}$' THEN
    RETURN v;
  END IF;
  m := regexp_match(v, '^EDU-?([A-Z0-9]{4})-?(\d{2})$');
  IF m IS NOT NULL THEN
    RETURN 'EDU-' || m[1] || '-' || m[2];
  END IF;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.connection_code_lookup_key(p_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT replace(public.normalize_connection_code_input(p_code), '-', '');
$$;

CREATE OR REPLACE FUNCTION public.resolve_academy_by_connection_code(p_code text)
RETURNS TABLE (id uuid, name text, connection_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name, a.connection_code
  FROM public.academies a
  WHERE public.connection_code_lookup_key(a.connection_code)
      = public.connection_code_lookup_key(p_code)
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- student_connection_requests.student_id nullable 보장 (012 미적용 DB 대비)
-- ---------------------------------------------------------------------------
ALTER TABLE public.student_connection_requests
  ALTER COLUMN student_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 구버전 RPC 제거 후 단일 시그니처로 재생성
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_student_connection_request(text, text);
DROP FUNCTION IF EXISTS public.submit_student_connection_request(text, text, text);

CREATE OR REPLACE FUNCTION public.submit_student_connection_request(
  p_code text,
  p_relationship text,
  p_student_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_user_grade text;
  v_academy_id uuid;
  v_academy_name text;
  v_student_name text;
  v_student_id uuid;
  v_match_count int;
  v_user_school text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_student_name := nullif(trim(p_student_name), '');
  IF v_student_name IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'student_name_required');
  END IF;

  SELECT role, school, grade
  INTO v_role, v_user_school, v_user_grade
  FROM public.users
  WHERE id = v_uid;

  IF p_relationship = 'student' THEN
    IF v_role <> 'student' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'student_role_required');
    END IF;
  ELSIF p_relationship IN ('mother', 'father', 'guardian') THEN
    IF v_role <> 'parent' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'parent_role_required');
    END IF;
  ELSE
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_relationship');
  END IF;

  SELECT a.id, a.name
  INTO v_academy_id, v_academy_name
  FROM public.resolve_academy_by_connection_code(p_code) a;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT count(*)::int, min(s.id)
  INTO v_match_count, v_student_id
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND lower(trim(s.name)) = lower(v_student_name);

  IF v_match_count > 1 AND nullif(trim(v_user_grade), '') IS NOT NULL THEN
    SELECT count(*)::int, min(s.id)
    INTO v_match_count, v_student_id
    FROM public.students s
    WHERE s.academy_id = v_academy_id
      AND lower(trim(s.name)) = lower(v_student_name)
      AND trim(s.grade) = trim(v_user_grade);
  END IF;

  IF v_match_count > 1 THEN
    v_student_id := NULL;
  END IF;

  IF v_student_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.student_connections sc
    WHERE sc.student_id = v_student_id AND sc.user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_connected');
  END IF;

  IF v_student_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.student_connections sc
    WHERE sc.student_id = v_student_id AND sc.relationship = p_relationship
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'relationship_taken');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.student_connection_requests r
    WHERE r.academy_id = v_academy_id
      AND r.user_id = v_uid
      AND lower(trim(coalesce(r.requested_student_name, ''))) = lower(v_student_name)
      AND r.status = 'pending'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pending_exists');
  END IF;

  INSERT INTO public.student_connection_requests (
    academy_id,
    student_id,
    user_id,
    relationship,
    requested_student_name,
    requester_school,
    requester_grade,
    status
  )
  VALUES (
    v_academy_id,
    v_student_id,
    v_uid,
    p_relationship,
    v_student_name,
    nullif(trim(v_user_school), ''),
    nullif(trim(v_user_grade), ''),
    'pending'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'academy_id', v_academy_id,
    'academy_name', v_academy_name,
    'student_id', v_student_id,
    'student_name', v_student_name,
    'needs_student_pick', v_student_id IS NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'request_failed', 'detail', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_academy_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_role       text;
  v_academy_id uuid;
  v_name       text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT role INTO v_role FROM public.users WHERE id = v_uid;

  IF v_role NOT IN ('admin', 'teacher', 'desk') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'staff_role_required');
  END IF;

  SELECT a.id, a.name
  INTO v_academy_id, v_name
  FROM public.resolve_academy_by_connection_code(p_code) a;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  UPDATE public.users
  SET academy_id = v_academy_id
  WHERE id = v_uid;

  RETURN jsonb_build_object(
    'ok', true,
    'academy_id', v_academy_id,
    'academy_name', v_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_academy_connection_code(
  p_academy_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid := coalesce(p_academy_id, public.current_academy_id());
  v_code text;
BEGIN
  IF NOT public.is_academy_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_academy_id <> public.current_academy_id() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  v_code := public.generate_connection_code();
  UPDATE public.academies SET connection_code = v_code WHERE id = v_academy_id;

  RETURN jsonb_build_object('ok', true, 'connection_code', v_code);
END;
$$;

-- 연결 요청 목록 RPC — requester 프로필 + academy_id 누락 레거시 포함
CREATE OR REPLACE FUNCTION public.get_pending_connection_requests(
  p_student_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
BEGIN
  IF NOT public.is_academy_staff() THEN
    RETURN '[]'::jsonb;
  END IF;

  v_academy_id := public.current_academy_id();
  IF v_academy_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        r.id,
        r.academy_id,
        r.student_id,
        r.user_id,
        r.relationship,
        r.requested_student_name,
        r.requester_school,
        r.requester_grade,
        r.status,
        r.created_at,
        r.reviewed_at,
        r.reviewed_by,
        jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'name', u.name,
          'school', u.school,
          'grade', u.grade
        ) AS "user",
        CASE
          WHEN s.id IS NOT NULL THEN
            jsonb_build_object('id', s.id, 'name', s.name, 'grade', s.grade)
          ELSE NULL
        END AS student
      FROM public.student_connection_requests r
      JOIN public.users u ON u.id = r.user_id
      LEFT JOIN public.students s ON s.id = r.student_id
      WHERE r.status = 'pending'
        AND (
          r.academy_id = v_academy_id
          OR (r.academy_id IS NULL AND s.academy_id = v_academy_id)
        )
        AND (p_student_id IS NULL OR r.student_id = p_student_id)
      ORDER BY r.created_at DESC
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_connection_code_input(text) FROM public;
REVOKE ALL ON FUNCTION public.connection_code_lookup_key(text) FROM public;
REVOKE ALL ON FUNCTION public.resolve_academy_by_connection_code(text) FROM public;
REVOKE ALL ON FUNCTION public.submit_student_connection_request(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.join_academy_by_code(text) FROM public;
REVOKE ALL ON FUNCTION public.regenerate_academy_connection_code(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_pending_connection_requests(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.normalize_connection_code_input(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.connection_code_lookup_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_academy_by_connection_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_student_connection_request(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_academy_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_academy_connection_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_connection_requests(uuid) TO authenticated;

-- 코드 없는 학원 백필
UPDATE public.academies
SET connection_code = public.generate_connection_code()
WHERE connection_code IS NULL OR trim(connection_code) = '';
