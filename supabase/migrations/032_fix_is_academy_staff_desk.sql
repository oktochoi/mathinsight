-- Phase 3: is_academy_staff() 함수에 'desk' 역할 추가
-- 이 함수를 사용하는 모든 RLS 정책(023, 006 기반)이 자동으로 desk를 포함하게 됨

CREATE OR REPLACE FUNCTION public.is_academy_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'teacher', 'desk')
      AND academy_id IS NOT NULL
  );
$$;

-- 031에서 만든 명시적 정책들은 그대로 유지
-- (is_academy_staff() 기반 정책들: class_teachers_staff, staff_profiles_staff 등이 자동으로 desk 포함)
