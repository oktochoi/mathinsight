-- 직원 권한/역할 저장 수정
-- 원인: users UPDATE는 본인만 가능, staff_permission_overrides는 users.role='admin'만 허용
--       academies.owner_id 원장이 RLS에 걸릴 수 있음

-- ---------------------------------------------------------------------------
-- 1. 원장 판별 (academies.owner_id 또는 users.role=admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_academy_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academies a
    WHERE a.id = public.current_academy_id()
      AND a.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.academy_id = public.current_academy_id()
      AND u.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_academy_owner() FROM public;
GRANT EXECUTE ON FUNCTION public.is_academy_owner() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. staff_permission_overrides RLS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "spo_owner_manage" ON public.staff_permission_overrides;

CREATE POLICY "spo_owner_manage" ON public.staff_permission_overrides
  FOR ALL
  USING (
    academy_id = public.current_academy_id()
    AND public.is_academy_owner()
  )
  WITH CHECK (
    academy_id = public.current_academy_id()
    AND public.is_academy_owner()
  );

-- ---------------------------------------------------------------------------
-- 3. 원장 → 같은 학원 직원 users.role 수정
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_update_staff_by_owner" ON public.users;

CREATE POLICY "users_update_staff_by_owner" ON public.users
  FOR UPDATE
  USING (
    id <> auth.uid()
    AND academy_id = public.current_academy_id()
    AND role IN ('admin', 'teacher', 'desk')
    AND public.is_academy_owner()
  )
  WITH CHECK (
    academy_id = public.current_academy_id()
    AND role IN ('admin', 'teacher', 'desk')
  );

-- ---------------------------------------------------------------------------
-- 4. RPC: 직원 권한 오버라이드 (RLS 우회·검증 일원화)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_staff_permission_override(
  p_user_id uuid,
  p_permission_key text,
  p_granted boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_target_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT public.is_academy_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owner_only');
  END IF;

  v_academy_id := public.current_academy_id();
  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_academy');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_edit_self');
  END IF;

  SELECT role INTO v_target_role
  FROM public.users
  WHERE id = p_user_id AND academy_id = v_academy_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'staff_not_found');
  END IF;

  IF v_target_role NOT IN ('admin', 'teacher', 'desk') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_target');
  END IF;

  IF p_granted IS NULL THEN
    DELETE FROM public.staff_permission_overrides
    WHERE user_id = p_user_id
      AND academy_id = v_academy_id
      AND permission_key = p_permission_key;
  ELSE
    INSERT INTO public.staff_permission_overrides (
      user_id, academy_id, permission_key, granted
    )
    VALUES (p_user_id, v_academy_id, p_permission_key, p_granted)
    ON CONFLICT (user_id, academy_id, permission_key)
    DO UPDATE SET granted = EXCLUDED.granted;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_staff_permission_override(uuid, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.set_staff_permission_override(uuid, text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: 직원 역할 변경 + academy_memberships 동기화
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_staff_member_role(
  p_user_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_membership_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF NOT public.is_academy_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owner_only');
  END IF;

  IF p_role NOT IN ('admin', 'teacher', 'desk') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_role');
  END IF;

  v_academy_id := public.current_academy_id();
  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_academy');
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_edit_self');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.academies a
    WHERE a.id = v_academy_id AND a.owner_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_change_owner');
  END IF;

  UPDATE public.users
  SET role = p_role
  WHERE id = p_user_id
    AND academy_id = v_academy_id
    AND role IN ('admin', 'teacher', 'desk');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'staff_not_found');
  END IF;

  v_membership_role := CASE p_role
    WHEN 'admin' THEN 'owner'
    ELSE p_role
  END;

  UPDATE public.academy_memberships
  SET status = 'inactive'
  WHERE user_id = p_user_id
    AND academy_id = v_academy_id
    AND role IN ('owner', 'teacher', 'desk');

  INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
  VALUES (p_user_id, v_academy_id, v_membership_role, 'active')
  ON CONFLICT (user_id, academy_id, role)
  DO UPDATE SET status = 'active';

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_staff_member_role(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_staff_member_role(uuid, text) TO authenticated;
