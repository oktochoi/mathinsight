-- 학생 채팅: 1:1(담당 교사) · 반 단톡

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role IN ('owner', 'admin', 'teacher', 'desk', 'parent', 'student'));

-- 학생: 본인 1:1 채널 조회
CREATE POLICY "chat_channels_student_direct" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'direct'
    AND student_id IS NOT NULL
    AND public.user_is_student_self(student_id)
  );

-- 학생: 소속 반 단톡 채널 조회
CREATE POLICY "chat_channels_student_class" ON public.chat_channels
  FOR SELECT
  USING (
    type = 'class_group'
    AND class_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.class_id = chat_channels.class_id
        AND public.user_is_student_self(s.id)
    )
  );

CREATE POLICY "chat_messages_student_read" ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND (
          (c.type = 'direct' AND c.student_id IS NOT NULL AND public.user_is_student_self(c.student_id))
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

CREATE POLICY "chat_messages_student_direct_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'direct'
        AND c.student_id IS NOT NULL
        AND public.user_is_student_self(c.student_id)
    )
  );

CREATE POLICY "chat_messages_student_class_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'class_group'
        AND c.class_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.class_id = c.class_id
            AND public.user_is_student_self(s.id)
        )
    )
  );

-- RPC: 학생도 채널 생성/조회 가능
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
    OR public.user_is_student_self(p_student_id)
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
        AND public.user_parent_of_student(s.id)
    )
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
