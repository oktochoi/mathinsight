-- Phase 2: academy_memberships 도입
-- 목표: users.role + users.academy_id → academy_memberships로 이전
-- 현재 users.role/academy_id는 유지 (호환성). academy_memberships를 새 primary로.

-- ---------------------------------------------------------------------------
-- 1. academy_memberships 테이블
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'teacher', 'desk', 'parent', 'student')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'invited', 'pending')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, academy_id, role)
);

CREATE INDEX IF NOT EXISTS academy_memberships_user_id_idx
  ON public.academy_memberships (user_id);
CREATE INDEX IF NOT EXISTS academy_memberships_academy_id_idx
  ON public.academy_memberships (academy_id, role, status);

-- ---------------------------------------------------------------------------
-- 2. academy_invitations 테이블 (초대 링크/코드 관리)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.users(id),
  role text NOT NULL CHECK (role IN ('teacher', 'desk', 'parent', 'student')),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. 기존 users 데이터 → academy_memberships backfill
-- ---------------------------------------------------------------------------
INSERT INTO public.academy_memberships (user_id, academy_id, role, status, joined_at)
SELECT
  u.id,
  u.academy_id,
  CASE u.role
    WHEN 'admin' THEN 'owner'
    ELSE u.role
  END,
  'active',
  u.created_at
FROM public.users u
WHERE u.academy_id IS NOT NULL
  AND u.role IN ('admin', 'teacher', 'desk', 'parent', 'student')
ON CONFLICT (user_id, academy_id, role) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. RLS: academy_memberships
-- ---------------------------------------------------------------------------
ALTER TABLE public.academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_invitations ENABLE ROW LEVEL SECURITY;

-- 본인 멤버십 조회
CREATE POLICY "memberships_select_own"
  ON public.academy_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Staff: 같은 학원의 모든 멤버십 조회
CREATE POLICY "memberships_select_staff"
  ON public.academy_memberships FOR SELECT
  USING (
    academy_id = public.current_academy_id()
    AND public.is_academy_staff()
  );

-- Owner만 멤버십 insert/update/delete
CREATE POLICY "memberships_manage_owner"
  ON public.academy_memberships FOR ALL
  USING (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
        AND u.academy_id = academy_memberships.academy_id
    )
  );

-- 초대장 조회: staff
CREATE POLICY "invitations_select_staff"
  ON public.academy_invitations FOR SELECT
  USING (
    academy_id = public.current_academy_id()
    AND public.is_academy_staff()
  );

-- ---------------------------------------------------------------------------
-- 5. handle_new_user 트리거 업데이트 → academy_memberships도 생성
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_academy_id uuid;
  user_role      text;
  user_name      text;
  academy_name   text;
  setup          text;
  membership_role text;
BEGIN
  setup := coalesce(NEW.raw_user_meta_data->>'profile_setup', '');
  IF setup <> 'complete' THEN
    RETURN NEW;
  END IF;

  user_role    := coalesce(NEW.raw_user_meta_data->>'role', 'parent');
  user_name    := coalesce(nullif(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1));
  academy_name := nullif(trim(NEW.raw_user_meta_data->>'academy_name'), '');

  -- users 행 생성
  IF user_role = 'admin' AND academy_name IS NOT NULL THEN
    INSERT INTO public.academies (name, owner_id)
    VALUES (academy_name, NEW.id)
    RETURNING id INTO new_academy_id;

    INSERT INTO public.users (id, email, name, role, academy_id, onboarding_complete)
    VALUES (NEW.id, NEW.email, user_name, 'admin', new_academy_id, false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.classes (academy_id, teacher_id, name, grade)
    VALUES (new_academy_id, NEW.id, 'A반', '중1')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.users (id, email, name, role, academy_id, onboarding_complete)
    VALUES (
      NEW.id,
      NEW.email,
      user_name,
      CASE
        WHEN user_role IN ('admin', 'teacher', 'desk', 'parent', 'student') THEN user_role
        ELSE 'parent'
      END,
      null,
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- academy_memberships 행 생성 (학원이 있는 경우)
  IF new_academy_id IS NOT NULL THEN
    membership_role := CASE user_role WHEN 'admin' THEN 'owner' ELSE user_role END;
    INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
    VALUES (NEW.id, new_academy_id, membership_role, 'active')
    ON CONFLICT (user_id, academy_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 6. users.academy_id UPDATE 시 academy_memberships 자동 동기화 트리거
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_academy_membership_on_user_update()
RETURNS TRIGGER AS $$
DECLARE
  membership_role text;
BEGIN
  -- academy_id가 새로 설정된 경우
  IF NEW.academy_id IS NOT NULL AND NEW.academy_id IS DISTINCT FROM OLD.academy_id THEN
    membership_role := CASE NEW.role
      WHEN 'admin'   THEN 'owner'
      WHEN 'teacher' THEN 'teacher'
      WHEN 'desk'    THEN 'desk'
      WHEN 'parent'  THEN 'parent'
      WHEN 'student' THEN 'student'
      ELSE NEW.role
    END;

    INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
    VALUES (NEW.id, NEW.academy_id, membership_role, 'active')
    ON CONFLICT (user_id, academy_id, role) DO UPDATE SET status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_membership_on_user_update ON public.users;
CREATE TRIGGER sync_membership_on_user_update
  AFTER UPDATE OF academy_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_academy_membership_on_user_update();

-- ---------------------------------------------------------------------------
-- 7. accept_academy_invitation RPC (초대 링크 수락)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_academy_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  inv record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv
  FROM public.academy_invitations
  WHERE token = p_token AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    UPDATE public.academy_invitations SET status = 'expired' WHERE id = inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF inv.max_uses IS NOT NULL AND inv.used_count >= inv.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'max_uses_reached');
  END IF;

  -- users.role / academy_id 업데이트 (초대 역할로 재설정)
  UPDATE public.users
  SET
    academy_id = inv.academy_id,
    role = CASE inv.role WHEN 'owner' THEN 'admin' ELSE inv.role END
  WHERE id = v_uid;

  -- membership upsert (trigger도 실행되지만 명시적으로도)
  INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
  VALUES (v_uid, inv.academy_id, inv.role, 'active')
  ON CONFLICT (user_id, academy_id, role) DO UPDATE SET status = 'active';

  -- 사용 횟수 증가
  UPDATE public.academy_invitations
  SET used_count = used_count + 1
  WHERE id = inv.id;

  RETURN jsonb_build_object(
    'ok', true,
    'academy_id', inv.academy_id,
    'role', inv.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_academy_invitation(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_academy_invitation(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. is_academy_staff() 업데이트 — academy_memberships도 체크
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_academy_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'teacher', 'desk')
      AND u.academy_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.academy_memberships am
    WHERE am.user_id = auth.uid()
      AND am.role IN ('owner', 'teacher', 'desk')
      AND am.status = 'active'
  );
$$;
