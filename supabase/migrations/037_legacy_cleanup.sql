-- Phase 1: 레거시 필드 정리
-- 목표: student_connections가 이미 단일 truth source → 레거시 직접 링크 필드 제거
-- 전제: 036_user_onboarding_v2.sql 실행 완료, student_connections 백필 완료

-- ---------------------------------------------------------------------------
-- 1. 레거시 학생 포털 필드 제거 (students.parent_user_id, student_user_id)
--    이미 011_student_connection_codes.sql에서 student_connections로 backfill됨
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- 아직 students.parent_user_id 기준으로 student_connections에 없는 행 백필
  INSERT INTO public.student_connections (student_id, user_id, relationship)
  SELECT s.id, s.parent_user_id, 'guardian'
  FROM public.students s
  WHERE s.parent_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.student_connections sc
      WHERE sc.student_id = s.id AND sc.user_id = s.parent_user_id
    )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.student_connections (student_id, user_id, relationship)
  SELECT s.id, s.student_user_id, 'student'
  FROM public.students s
  WHERE s.student_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.student_connections sc
      WHERE sc.student_id = s.id AND sc.relationship = 'student'
    )
  ON CONFLICT DO NOTHING;
END $$;

-- 레거시 컬럼 제거
ALTER TABLE public.students
  DROP COLUMN IF EXISTS parent_user_id,
  DROP COLUMN IF EXISTS student_user_id,
  DROP COLUMN IF EXISTS parent_invite_email,
  DROP COLUMN IF EXISTS student_invite_email;

-- ---------------------------------------------------------------------------
-- 2. sync_student_portal_user_ids 함수 무효화 (더 이상 쓸 컬럼 없음)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_student_portal_user_ids(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 레거시 컬럼 제거됨. 이 함수는 호환성을 위해 no-op으로 유지.
  NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. classes.teacher_id → class_teachers 완전 이전을 위한 view 생성
--    (classes.teacher_id는 아직 유지하되, 조회는 view를 통해)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_class_homeroom_teacher AS
  SELECT
    ct.class_id,
    sp.user_id AS teacher_user_id,
    sp.id AS staff_id,
    u.name AS teacher_name
  FROM public.class_teachers ct
  JOIN public.staff_profiles sp ON sp.id = ct.staff_id
  JOIN public.users u ON u.id = sp.user_id
  WHERE ct.role = 'homeroom'
    AND ct.end_date IS NULL;

-- ---------------------------------------------------------------------------
-- 4. students.connection_code nullable 유지 (012에서 이미 drop not null)
--    student_code가 없으면 connection_code로 fallback하도록 정규화 함수 추가
-- ---------------------------------------------------------------------------
-- students table에 student_code가 없을 경우 connection_code 사용 안내:
-- submit_student_connection_request는 academies.connection_code 기준이므로
-- students 개별 코드(connection_code)는 더 이상 연결에 사용되지 않음
-- legacy 데이터 보존을 위해 컬럼은 유지

COMMENT ON COLUMN public.students.connection_code IS
  'DEPRECATED: 더 이상 연결에 사용되지 않음. submit_student_connection_request는 academies.connection_code + 학생 이름을 사용.';
