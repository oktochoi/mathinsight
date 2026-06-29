-- 039 users_select_connection_requestors 롤백 + 안전한 RPC 대체
-- users RLS 안에서 student_connection_requests 조회 시 RLS 체인 → 세션/프로필 손상

DROP POLICY IF EXISTS "users_select_connection_requestors" ON public.users;

DROP FUNCTION IF EXISTS public.get_pending_connection_requests(uuid);
DROP FUNCTION IF EXISTS public.get_pending_connection_requests();

CREATE OR REPLACE FUNCTION public.get_pending_connection_requests(
  p_student_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
BEGIN
  IF NOT public.is_academy_staff() THEN
    RETURN '[]'::jsonb;
  END IF;

  v_academy_id := public.current_academy_id();
  IF v_academy_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN (
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        r.id,
        r.academy_id,
        r.student_id,
        r.user_id,
        r.relationship,
        r.requested_student_name,
        r.status,
        r.created_at,
        r.reviewed_at,
        r.reviewed_by,
        jsonb_build_object(
          'id', u.id,
          'email', u.email,
          'name', u.name
        ) AS "user",
        CASE
          WHEN s.id IS NOT NULL THEN
            jsonb_build_object('id', s.id, 'name', s.name, 'grade', s.grade)
          ELSE NULL
        END AS student
      FROM public.student_connection_requests r
      JOIN public.users u ON u.id = r.user_id
      LEFT JOIN public.students s ON s.id = r.student_id
      WHERE r.academy_id = v_academy_id
        AND r.status = 'pending'
        AND (p_student_id IS NULL OR r.student_id = p_student_id)
      ORDER BY r.created_at DESC
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_pending_connection_requests(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_pending_connection_requests(uuid) TO authenticated;
