-- Phase 1: desk(원무) 역할 추가
-- users.role CHECK 제약을 'desk' 포함으로 확장하고
-- handle_new_user / ensure_user_profile 함수도 갱신

-- 1. CHECK 제약 교체
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'teacher', 'desk', 'parent', 'student'));

-- 2. handle_new_user 트리거 함수: desk 허용
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_academy_id uuid;
  user_role      text;
  user_name      text;
  academy_name   text;
  setup          text;
BEGIN
  setup := coalesce(new.raw_user_meta_data->>'profile_setup', '');
  IF setup <> 'complete' THEN
    RETURN new;
  END IF;

  user_role    := coalesce(new.raw_user_meta_data->>'role', 'parent');
  IF user_role = 'owner' THEN user_role := 'admin'; END IF;

  user_name    := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));
  academy_name := nullif(trim(new.raw_user_meta_data->>'academy_name'), '');

  IF user_role = 'admin' AND academy_name IS NOT NULL THEN
    INSERT INTO public.academies (name, owner_id)
    VALUES (academy_name, new.id)
    RETURNING id INTO new_academy_id;

    INSERT INTO public.users (id, email, name, role, academy_id)
    VALUES (new.id, new.email, user_name, 'admin', new_academy_id);

    INSERT INTO public.classes (academy_id, teacher_id, name, grade)
    VALUES (new_academy_id, new.id, 'A반', '중1');
  ELSE
    INSERT INTO public.users (id, email, name, role, academy_id)
    VALUES (
      new.id,
      new.email,
      user_name,
      CASE
        WHEN user_role IN ('admin', 'teacher', 'desk', 'parent', 'student') THEN user_role
        ELSE 'parent'
      END,
      NULL
    );
  END IF;

  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RETURN new;
END;
$$;

-- 3. ensure_user_profile RPC: desk 허용
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid          uuid := auth.uid();
  au           record;
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

  SELECT id, email, raw_user_meta_data
  INTO au
  FROM auth.users
  WHERE id = uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_user_not_found');
  END IF;

  setup := coalesce(au.raw_user_meta_data->>'profile_setup', '');
  IF setup <> 'complete' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_setup_pending');
  END IF;

  user_role    := coalesce(au.raw_user_meta_data->>'role', 'parent');
  IF user_role = 'owner' THEN user_role := 'admin'; END IF;

  user_name    := coalesce(nullif(trim(au.raw_user_meta_data->>'name'), ''), split_part(au.email, '@', 1));
  academy_name := nullif(trim(au.raw_user_meta_data->>'academy_name'), '');

  IF user_role = 'admin' AND academy_name IS NOT NULL THEN
    INSERT INTO public.academies (name, owner_id)
    VALUES (academy_name, uid)
    RETURNING id INTO new_academy_id;

    INSERT INTO public.users (id, email, name, role, academy_id)
    VALUES (uid, au.email, user_name, 'admin', new_academy_id);

    INSERT INTO public.classes (academy_id, teacher_id, name, grade)
    VALUES (new_academy_id, uid, 'A반', '중1');
  ELSE
    INSERT INTO public.users (id, email, name, role, academy_id)
    VALUES (
      uid,
      au.email,
      user_name,
      CASE
        WHEN user_role IN ('admin', 'teacher', 'desk', 'parent', 'student') THEN user_role
        ELSE 'parent'
      END,
      NULL
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'created', false);
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- 4. RLS: desk도 스탭 정책 적용 (기존 정책 대체)
-- students
DROP POLICY IF EXISTS "students_academy_staff" ON public.students;
CREATE POLICY "students_academy_staff" ON public.students
  FOR ALL
  USING (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'teacher', 'desk')
    )
  )
  WITH CHECK (academy_id = public.current_academy_id());

-- lesson_logs
DROP POLICY IF EXISTS "lesson_logs_academy_staff" ON public.lesson_logs;
CREATE POLICY "lesson_logs_academy_staff" ON public.lesson_logs
  FOR ALL
  USING (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'teacher', 'desk')
    )
  )
  WITH CHECK (academy_id = public.current_academy_id());

-- consultation_cards
DROP POLICY IF EXISTS "consultation_cards_academy_staff" ON public.consultation_cards;
CREATE POLICY "consultation_cards_academy_staff" ON public.consultation_cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = consultation_cards.student_id
        AND s.academy_id = public.current_academy_id()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'teacher', 'desk')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = consultation_cards.student_id
        AND s.academy_id = public.current_academy_id()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'teacher', 'desk')
        )
    )
  );

-- parent_reports
DROP POLICY IF EXISTS "parent_reports_academy_staff" ON public.parent_reports;
CREATE POLICY "parent_reports_academy_staff" ON public.parent_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = parent_reports.student_id
        AND s.academy_id = public.current_academy_id()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'teacher', 'desk')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = parent_reports.student_id
        AND s.academy_id = public.current_academy_id()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'teacher', 'desk')
        )
    )
  );
