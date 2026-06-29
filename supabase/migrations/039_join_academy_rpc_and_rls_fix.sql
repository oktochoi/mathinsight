-- Fix 1: 학원 참여 RPC (teacher/desk — academies RLS 우회)
-- ConnectAcademyPanel이 직접 academies 조회 시 RLS에 막힘
-- → SECURITY DEFINER RPC로 대체

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

  SELECT id, name
  INTO v_academy_id, v_name
  FROM public.academies
  WHERE upper(trim(connection_code)) = upper(trim(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
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

REVOKE ALL ON FUNCTION public.join_academy_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_academy_by_code(text) TO authenticated;

-- 연결 요청 + users JOIN: users RLS 정책 추가 금지 (039 초안이 세션 손상 유발)
-- → 040 get_pending_connection_requests() SECURITY DEFINER RPC 사용
