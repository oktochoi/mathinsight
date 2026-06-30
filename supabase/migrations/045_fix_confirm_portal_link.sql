-- 037에서 students.parent_user_id / student_user_id 제거됨.
-- 044 confirm_portal_link가 레거시 컬럼을 갱신하던 부분 수정.

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
