-- 학부모: 반 톡방 제외 · 학부모/학생 1:1 채널 분리

ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS direct_audience text;

ALTER TABLE public.chat_channels
  DROP CONSTRAINT IF EXISTS chat_channels_direct_audience_check;

ALTER TABLE public.chat_channels
  ADD CONSTRAINT chat_channels_direct_audience_check
  CHECK (
    (type = 'direct' AND direct_audience IN ('parent', 'student'))
    OR (type = 'class_group' AND direct_audience IS NULL)
  );

UPDATE public.chat_channels
SET direct_audience = 'parent'
WHERE type = 'direct' AND direct_audience IS NULL;

DROP INDEX IF EXISTS public.chat_channels_direct_student_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS chat_channels_direct_student_audience_uidx
  ON public.chat_channels (student_id, direct_audience)
  WHERE type = 'direct';

-- 학부모 반 톡방 접근 제거
DROP POLICY IF EXISTS "chat_channels_parent_class" ON public.chat_channels;
DROP POLICY IF EXISTS "chat_messages_parent_class_insert" ON public.chat_messages;

DROP POLICY IF EXISTS "chat_channels_parent_direct" ON public.chat_channels;
CREATE POLICY "chat_channels_parent_direct" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'direct'
    AND direct_audience = 'parent'
    AND student_id IS NOT NULL
    AND public.user_parent_of_student(student_id)
  );

DROP POLICY IF EXISTS "chat_channels_student_direct" ON public.chat_channels;
CREATE POLICY "chat_channels_student_direct" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'direct'
    AND direct_audience = 'student'
    AND student_id IS NOT NULL
    AND public.user_is_student_self(student_id)
  );

DROP POLICY IF EXISTS "chat_messages_parent_read" ON public.chat_messages;
CREATE POLICY "chat_messages_parent_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'direct'
        AND c.direct_audience = 'parent'
        AND c.student_id IS NOT NULL
        AND public.user_parent_of_student(c.student_id)
    )
  );

DROP POLICY IF EXISTS "chat_messages_parent_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_parent_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'direct'
        AND c.direct_audience = 'parent'
        AND c.student_id IS NOT NULL
        AND public.user_parent_of_student(c.student_id)
    )
  );

DROP POLICY IF EXISTS "chat_messages_student_read" ON public.chat_messages;
CREATE POLICY "chat_messages_student_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND (
          (
            c.type = 'direct'
            AND c.direct_audience = 'student'
            AND c.student_id IS NOT NULL
            AND public.user_is_student_self(c.student_id)
          )
          OR (
            c.type = 'class_group'
            AND c.class_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.students s
              WHERE s.class_id = c.class_id
                AND public.user_is_student_self(s.id)
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "chat_messages_student_direct_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_student_direct_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'direct'
        AND c.direct_audience = 'student'
        AND c.student_id IS NOT NULL
        AND public.user_is_student_self(c.student_id)
    )
  );

CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat_channel(
  p_student_id uuid,
  p_audience text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_channel_id uuid;
  v_audience text;
BEGIN
  SELECT academy_id INTO v_academy_id
  FROM public.students
  WHERE id = p_student_id;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'student not found';
  END IF;

  IF p_audience IN ('parent', 'student') THEN
    v_audience := p_audience;
  ELSIF public.user_parent_of_student(p_student_id) THEN
    v_audience := 'parent';
  ELSIF public.user_is_student_self(p_student_id) THEN
    v_audience := 'student';
  ELSE
    RAISE EXCEPTION 'direct audience required';
  END IF;

  IF NOT (
    (public.is_academy_staff() AND public.current_academy_id() = v_academy_id)
    OR (v_audience = 'parent' AND public.user_parent_of_student(p_student_id))
    OR (v_audience = 'student' AND public.user_is_student_self(p_student_id))
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT id INTO v_channel_id
  FROM public.chat_channels
  WHERE type = 'direct'
    AND student_id = p_student_id
    AND direct_audience = v_audience
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO public.chat_channels (academy_id, type, student_id, direct_audience)
    VALUES (v_academy_id, 'direct', p_student_id, v_audience)
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_class_group_chat_channel(p_class_id uuid)
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
  FROM public.classes
  WHERE id = p_class_id;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'class not found';
  END IF;

  IF NOT (
    (public.is_academy_staff() AND public.current_academy_id() = v_academy_id)
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.class_id = p_class_id
        AND public.user_is_student_self(s.id)
    )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT id INTO v_channel_id
  FROM public.chat_channels
  WHERE type = 'class_group' AND class_id = p_class_id
  LIMIT 1;

  IF v_channel_id IS NULL THEN
    INSERT INTO public.chat_channels (academy_id, type, class_id)
    VALUES (v_academy_id, 'class_group', p_class_id)
    RETURNING id INTO v_channel_id;
  END IF;

  RETURN v_channel_id;
END;
$$;

COMMENT ON COLUMN public.chat_channels.direct_audience IS '1:1 채널 대상: parent(학부모↔선생) | student(학생↔선생)';
