-- 반 단톡 채널 RPC + 학부모 반 단톡 메시지 INSERT

CREATE POLICY "chat_messages_parent_class_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = chat_messages.channel_id
        AND c.type = 'class_group'
        AND c.class_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.class_id = c.class_id
            AND public.user_parent_of_student(s.id)
        )
    )
  );

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

REVOKE ALL ON FUNCTION public.get_or_create_class_group_chat_channel(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_class_group_chat_channel(uuid) TO authenticated;
