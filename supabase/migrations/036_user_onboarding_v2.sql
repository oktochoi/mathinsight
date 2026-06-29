-- 역할별 온보딩 v2: users 테이블에 프로필 필드 + onboarding_complete 추가

-- 1. 새 컬럼 추가
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender     text CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS birthdate  date,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- 2. 기존 사용자 백필 (이미 가입·운영 중이므로 완료 처리)
UPDATE public.users SET onboarding_complete = true WHERE onboarding_complete = false;

-- 3. handle_new_user 트리거 업데이트
--    - desk 역할 추가
--    - onboarding_complete = false 명시적 삽입
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_academy_id uuid;
  user_role      text;
  user_name      text;
  academy_name   text;
  setup          text;
BEGIN
  setup := coalesce(NEW.raw_user_meta_data->>'profile_setup', '');
  IF setup <> 'complete' THEN
    RETURN NEW;
  END IF;

  user_role    := coalesce(NEW.raw_user_meta_data->>'role', 'parent');
  user_name    := coalesce(nullif(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1));
  academy_name := nullif(trim(NEW.raw_user_meta_data->>'academy_name'), '');

  -- 원장 + 학원명 있을 때만 학원 자동 생성
  IF user_role = 'admin' AND academy_name IS NOT NULL THEN
    INSERT INTO public.academies (name, owner_id)
    VALUES (academy_name, NEW.id)
    RETURNING id INTO new_academy_id;

    INSERT INTO public.users (id, email, name, role, academy_id, onboarding_complete)
    VALUES (NEW.id, NEW.email, user_name, 'admin', new_academy_id, false);

    INSERT INTO public.classes (academy_id, teacher_id, name, grade)
    VALUES (new_academy_id, NEW.id, 'A반', '중1');
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
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. ensure_user_profile RPC 업데이트 (onboarding_complete = false 포함)
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid          uuid := auth.uid();
  au           RECORD;
  new_academy_id uuid;
  user_role    text;
  user_name    text;
  academy_name text;
  setup        text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = uid) THEN
    RETURN jsonb_build_object('ok', true, 'created', false);
  END IF;

  SELECT id, email, raw_user_meta_data INTO au FROM auth.users WHERE id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_user_not_found');
  END IF;

  setup := coalesce(au.raw_user_meta_data->>'profile_setup', '');
  IF setup <> 'complete' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_setup_pending');
  END IF;

  user_role    := coalesce(au.raw_user_meta_data->>'role', 'parent');
  user_name    := coalesce(nullif(trim(au.raw_user_meta_data->>'name'), ''), split_part(au.email, '@', 1));
  academy_name := nullif(trim(au.raw_user_meta_data->>'academy_name'), '');

  IF user_role = 'admin' AND academy_name IS NOT NULL THEN
    INSERT INTO public.academies (name, owner_id)
    VALUES (academy_name, uid)
    RETURNING id INTO new_academy_id;

    INSERT INTO public.users (id, email, name, role, academy_id, onboarding_complete)
    VALUES (uid, au.email, user_name, 'admin', new_academy_id, false);

    INSERT INTO public.classes (academy_id, teacher_id, name, grade)
    VALUES (new_academy_id, uid, 'A반', '중1');
  ELSE
    INSERT INTO public.users (id, email, name, role, academy_id, onboarding_complete)
    VALUES (
      uid,
      au.email,
      user_name,
      CASE
        WHEN user_role IN ('admin', 'teacher', 'desk', 'parent', 'student') THEN user_role
        ELSE 'parent'
      END,
      null,
      false
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'created', false);
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
