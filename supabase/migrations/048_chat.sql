-- P2-1: 학부모↔학원 1:1 채팅 + 반 단톡

CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('direct', 'class_group')),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_channels_direct_student CHECK (
    type <> 'direct' OR student_id IS NOT NULL
  ),
  CONSTRAINT chat_channels_class_group CHECK (
    type <> 'class_group' OR class_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_channels_direct_student_uidx
  ON public.chat_channels (student_id)
  WHERE type = 'direct';

CREATE UNIQUE INDEX IF NOT EXISTS chat_channels_class_group_uidx
  ON public.chat_channels (class_id)
  WHERE type = 'class_group';

CREATE INDEX IF NOT EXISTS chat_channels_academy_updated_idx
  ON public.chat_channels (academy_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('owner', 'admin', 'teacher', 'desk', 'parent')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx
  ON public.chat_messages (channel_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_chat_channel_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chat_channels
  SET updated_at = now()
  WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_touch_channel ON public.chat_messages;
CREATE TRIGGER chat_messages_touch_channel
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_chat_channel_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_channels_staff" ON public.chat_channels
  FOR ALL
  USING (academy_id = public.current_academy_id() AND public.is_academy_staff())
  WITH CHECK (academy_id = public.current_academy_id());

CREATE POLICY "chat_channels_parent_direct" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'direct'
    AND student_id IS NOT NULL
    AND public.user_parent_of_student(student_id)
  );

CREATE POLICY "chat_channels_parent_class" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'class_group'
    AND class_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.class_id = chat_channels.class_id
        AND public.user_parent_of_student(s.id)
    )
  );

CREATE POLICY "chat_messages_staff" ON public.chat_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.academy_id = public.current_academy_id()
        AND public.is_academy_staff()
    )
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.academy_id = public.current_academy_id()
        AND public.is_academy_staff()
    )
  );

CREATE POLICY "chat_messages_parent_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND (
          (c.type = 'direct' AND c.student_id IS NOT NULL AND public.user_parent_of_student(c.student_id))
          OR (
            c.type = 'class_group'
            AND c.class_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.students s
              WHERE s.class_id = c.class_id
                AND public.user_parent_of_student(s.id)
            )
          )
        )
    )
  );

CREATE POLICY "chat_messages_parent_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'direct'
        AND c.student_id IS NOT NULL
        AND public.user_parent_of_student(c.student_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: 1:1 채널 조회/생성
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat_channel(p_student_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_channel_id uuid;
BEGIN
  SELECT academy_id INTO v_academy_id
  FROM public.students
  WHERE id = p_student_id;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'student not found';
  END IF;

  IF NOT (
    (public.is_academy_staff() AND public.current_academy_id() = v_academy_id)
    OR public.user_parent_of_student(p_student_id)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT id INTO v_channel_id
  FROM public.chat_channels
  WHERE type = 'direct' AND student_id = p_student_id
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO public.chat_channels (academy_id, type, student_id)
    VALUES (v_academy_id, 'direct', p_student_id)
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_direct_chat_channel(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat_channel(uuid) TO authenticated;

COMMENT ON TABLE public.chat_channels IS '학부모 1:1(direct) · 반 단톡(class_group) 채널';
COMMENT ON TABLE public.chat_messages IS '채팅 메시지 — Realtime 구독 대상';
