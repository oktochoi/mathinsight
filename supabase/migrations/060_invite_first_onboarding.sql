-- Invite-first onboarding (INVITE_ONBOARDING_REDESIGN.md)
-- Phase 2–3: academy_invitations 확장, students.login_code, RPC 갱신

-- ---------------------------------------------------------------------------
-- 1. students: 로그인 코드 + PIN 잠금
-- ---------------------------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS login_code text,
  ADD COLUMN IF NOT EXISTS pin_must_reset boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pin_fail_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS students_login_code_key
  ON public.students (login_code)
  WHERE login_code IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. academy_invitations: token_hash + 대상 정보
-- ---------------------------------------------------------------------------
ALTER TABLE public.academy_invitations
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS target_email text,
  ADD COLUMN IF NOT EXISTS target_student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_parent_id uuid REFERENCES public.parents(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS invited_name text;

-- status에 used 추가
ALTER TABLE public.academy_invitations DROP CONSTRAINT IF EXISTS academy_invitations_status_check;
ALTER TABLE public.academy_invitations
  ADD CONSTRAINT academy_invitations_status_check
  CHECK (status IN ('active', 'expired', 'revoked', 'used'));

CREATE UNIQUE INDEX IF NOT EXISTS academy_invitations_token_hash_key
  ON public.academy_invitations (token_hash)
  WHERE token_hash IS NOT NULL;

-- 레거시 평문 token 제거 (앱 미사용)
ALTER TABLE public.academy_invitations DROP COLUMN IF EXISTS token;

-- ---------------------------------------------------------------------------
-- 3. 로그인 코드 생성 (DB — RPC에서 호출)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_student_login_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw text := '';
  i int;
  candidate text;
BEGIN
  FOR attempt IN 1..50 LOOP
    raw := '';
    FOR i IN 1..8 LOOP
      raw := raw || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    candidate := substr(raw, 1, 4) || '-' || substr(raw, 5, 4);
    IF NOT EXISTS (SELECT 1 FROM public.students s WHERE s.login_code = candidate) THEN
      RETURN candidate;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'login_code_generation_failed';
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. 초대 토큰 해시 조회용 (미리보기 — anon 허용)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preview_academy_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text := encode(digest(p_token, 'sha256'), 'hex');
  inv record;
  v_academy_name text;
  v_student_name text;
BEGIN
  SELECT ai.*, a.name AS academy_name
  INTO inv
  FROM public.academy_invitations ai
  JOIN public.academies a ON a.id = ai.academy_id
  WHERE ai.token_hash = v_hash AND ai.status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF inv.target_student_id IS NOT NULL THEN
    SELECT name INTO v_student_name FROM public.students WHERE id = inv.target_student_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'role', inv.role,
    'academy_name', inv.academy_name,
    'invited_name', inv.invited_name,
    'target_email', inv.target_email,
    'student_name', v_student_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_academy_invitation(text) FROM public;
GRANT EXECUTE ON FUNCTION public.preview_academy_invitation(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. accept_academy_invitation — token_hash + 이메일 일치 + parent 연결
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_academy_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_hash text := encode(digest(p_token, 'sha256'), 'hex');
  inv record;
  v_rel text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv
  FROM public.academy_invitations
  WHERE token_hash = v_hash AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF inv.target_email IS NOT NULL AND v_email <> lower(trim(inv.target_email)) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'email_mismatch',
      'expected_email', inv.target_email
    );
  END IF;

  -- users 동기화 (레거시 RLS 호환)
  UPDATE public.users
  SET
    academy_id = inv.academy_id,
    role = CASE inv.role
      WHEN 'owner' THEN 'admin'
      WHEN 'desk' THEN 'desk'
      WHEN 'teacher' THEN 'teacher'
      WHEN 'parent' THEN 'parent'
      ELSE 'student'
    END,
    onboarding_complete = true,
    updated_at = now()
  WHERE id = v_uid;

  INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
  VALUES (v_uid, inv.academy_id, inv.role, 'active')
  ON CONFLICT (user_id, academy_id, role) DO UPDATE SET status = 'active';

  IF inv.role = 'parent' AND inv.target_parent_id IS NOT NULL THEN
    UPDATE public.parents
    SET user_id = v_uid
    WHERE id = inv.target_parent_id AND academy_id = inv.academy_id;

    IF inv.target_student_id IS NOT NULL THEN
      SELECT coalesce(psl.relationship::text, 'guardian') INTO v_rel
      FROM public.parent_student_links psl
      WHERE psl.parent_id = inv.target_parent_id AND psl.student_id = inv.target_student_id
      LIMIT 1;

      INSERT INTO public.student_connections (student_id, user_id, relationship)
      VALUES (
        inv.target_student_id,
        v_uid,
        coalesce(v_rel, 'guardian')::public.connection_relationship
      )
      ON CONFLICT (student_id, user_id) DO NOTHING;
    END IF;
  END IF;

  UPDATE public.academy_invitations
  SET status = 'used', used_count = used_count + 1
  WHERE id = inv.id;

  RETURN jsonb_build_object(
    'ok', true,
    'academy_id', inv.academy_id,
    'role', inv.role,
    'student_id', inv.target_student_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_academy_invitation(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_academy_invitation(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. 학생 초대 코드 발급 (staff)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_student_invite(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  st record;
  v_code text;
BEGIN
  IF v_uid IS NULL OR NOT public.is_academy_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO st FROM public.students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'student_not_found');
  END IF;

  IF st.login_code IS NULL THEN
    v_code := public.generate_student_login_code();
    UPDATE public.students
    SET login_code = v_code, pin_must_reset = true, pin_fail_count = 0, pin_locked_until = null
    WHERE id = p_student_id;
  ELSE
    v_code := st.login_code;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'login_code', v_code,
    'student_id', p_student_id,
    'pin_must_reset', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_student_invite(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_student_invite(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. 학생 PIN 잠금/실패 (student-login API에서 호출)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_student_pin_failure(p_login_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st record;
BEGIN
  SELECT id, pin_fail_count INTO st
  FROM public.students
  WHERE login_code = upper(replace(trim(p_login_code), ' ', ''))
  FOR UPDATE;

  IF NOT FOUND THEN
    PERFORM pg_sleep(0.3);
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF st.pin_fail_count + 1 >= 5 THEN
    UPDATE public.students
    SET pin_fail_count = 0, pin_locked_until = now() + interval '10 minutes'
    WHERE id = st.id;
  ELSE
    UPDATE public.students SET pin_fail_count = pin_fail_count + 1 WHERE id = st.id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.record_student_pin_failure(text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_student_pin_failure(text) TO service_role;

CREATE OR REPLACE FUNCTION public.clear_student_pin_lock(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET pin_fail_count = 0, pin_locked_until = null
  WHERE id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_student_pin_lock(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.clear_student_pin_lock(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_student_for_login(p_login_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st record;
  v_academy text;
BEGIN
  SELECT s.*, a.name AS academy_name
  INTO st
  FROM public.students s
  JOIN public.academies a ON a.id = s.academy_id
  WHERE s.login_code = upper(replace(trim(p_login_code), ' ', ''))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF st.pin_locked_until IS NOT NULL AND st.pin_locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'locked');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'student_id', st.id,
    'name', st.name,
    'grade', st.grade,
    'academy_name', st.academy_name,
    'pin_must_reset', st.pin_must_reset
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_for_login(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_student_for_login(text) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_student_pin_reset_done(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET pin_must_reset = false, pin_fail_count = 0, pin_locked_until = null
  WHERE id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_student_pin_reset_done(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_student_pin_reset_done(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 8. 보호자 초대 발급 (staff)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_parent_invitation(
  p_parent_id uuid,
  p_student_id uuid,
  p_invited_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pr record;
  st record;
  v_token text;
  v_hash text;
  inv_id uuid;
BEGIN
  IF NOT public.is_academy_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO pr FROM public.parents WHERE id = p_parent_id;
  IF NOT FOUND OR pr.email IS NULL OR trim(pr.email) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'parent_email_required');
  END IF;

  SELECT * INTO st FROM public.students WHERE id = p_student_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'student_not_found');
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.academy_invitations (
    academy_id, invited_by, role, token_hash,
    target_email, target_student_id, target_parent_id, invited_name,
    expires_at, status
  ) VALUES (
    pr.academy_id, p_invited_by, 'parent', v_hash,
    lower(trim(pr.email)), p_student_id, p_parent_id, pr.name,
    now() + interval '7 days', 'active'
  )
  RETURNING id INTO inv_id;

  RETURN jsonb_build_object('ok', true, 'invitation_id', inv_id, 'token', v_token);
END;
$$;

REVOKE ALL ON FUNCTION public.create_parent_invitation(uuid, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_parent_invitation(uuid, uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.create_parent_invitation IS 'token은 1회만 반환 — 이메일 발송용';
