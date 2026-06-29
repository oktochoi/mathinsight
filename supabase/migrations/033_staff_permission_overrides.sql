-- Phase 4: 직원별 권한 오버라이드 테이블
-- 역할 기본값에서 벗어난 개별 권한을 저장
-- granted=true: 기본 없는 권한 추가, granted=false: 기본 있는 권한 제거

CREATE TABLE IF NOT EXISTS public.staff_permission_overrides (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  academy_id     uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  granted        boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, academy_id, permission_key)
);

CREATE INDEX IF NOT EXISTS spo_user_academy_idx
  ON public.staff_permission_overrides (user_id, academy_id);

ALTER TABLE public.staff_permission_overrides ENABLE ROW LEVEL SECURITY;

-- 원장(admin)만 읽기/쓰기
CREATE POLICY "spo_owner_manage" ON public.staff_permission_overrides
  FOR ALL
  USING (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (academy_id = public.current_academy_id());

-- 본인 권한은 본인이 읽을 수 있음 (훅에서 조회)
CREATE POLICY "spo_self_read" ON public.staff_permission_overrides
  FOR SELECT
  USING (user_id = auth.uid());
