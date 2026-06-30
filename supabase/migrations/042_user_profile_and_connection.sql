-- 학생·학부모 프로필 확장 + 연결 요청 시 학교·학년 컨텍스트

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS grade text;

ALTER TABLE public.student_connection_requests
  ADD COLUMN IF NOT EXISTS requester_school text,
  ADD COLUMN IF NOT EXISTS requester_grade text;

-- 기존 학원에 connection_code가 없으면 채움 (012 미적용·수동 insert 대비)
UPDATE public.academies
SET connection_code = public.generate_connection_code()
WHERE connection_code IS NULL OR trim(connection_code) = '';

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
  v_academy_id uuid;
  v_academy_name text;
  v_student_name text;
  v_student_id uuid;
  v_match_count int;
  v_user_school text;
  v_user_grade text;
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
  FROM public.academies a
  WHERE upper(trim(a.connection_code)) = upper(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT count(*)::int, min(s.id)
  INTO v_match_count, v_student_id
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND lower(trim(s.name)) = lower(v_student_name);

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
      AND lower(trim(r.requested_student_name)) = lower(v_student_name)
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
END;
$$;
