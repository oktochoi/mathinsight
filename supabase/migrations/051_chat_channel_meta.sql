-- 채널 표시 이름 · 읽음 상태 · 미읽음 집계

ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS display_name text;

COMMENT ON COLUMN public.chat_channels.display_name IS '사용자 지정 채팅방 이름 (없으면 학생/반 이름 자동)';

CREATE TABLE IF NOT EXISTS public.chat_channel_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS chat_channel_reads_user_idx
  ON public.chat_channel_reads (user_id);

ALTER TABLE public.chat_channel_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_channel_reads_own" ON public.chat_channel_reads
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c WHERE c.id = chat_channel_reads.channel_id
    )
  );

-- RLS가 적용된 메시지 기준 미읽음 (역할별 채널 접근 자동 반영)
CREATE OR REPLACE FUNCTION public.get_my_chat_unread_count()
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.chat_messages m
  LEFT JOIN public.chat_channel_reads r
    ON r.channel_id = m.channel_id AND r.user_id = auth.uid()
  WHERE m.sender_id <> auth.uid()
    AND m.created_at > COALESCE(r.last_read_at, '1970-01-01'::timestamptz);
$$;

CREATE OR REPLACE FUNCTION public.get_my_chat_unread_by_channel()
RETURNS TABLE(channel_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT m.channel_id, COUNT(*)::bigint
  FROM public.chat_messages m
  LEFT JOIN public.chat_channel_reads r
    ON r.channel_id = m.channel_id AND r.user_id = auth.uid()
  WHERE m.sender_id <> auth.uid()
    AND m.created_at > COALESCE(r.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY m.channel_id;
$$;

REVOKE ALL ON FUNCTION public.get_my_chat_unread_count() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_chat_unread_count() TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_chat_unread_by_channel() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_chat_unread_by_channel() TO authenticated;
