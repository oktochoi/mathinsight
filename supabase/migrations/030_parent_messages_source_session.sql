-- parent_messages.source_session_id: 상담 세션에서 생성된 학부모 리포트 추적.
-- 상담 완료 → 학부모 리포트 작성 워크플로우에서 설정됨 (P4-1 counseling CTA 참조).
-- nullable — 직접 작성된 문의에는 연결 세션이 없음.

alter table public.parent_messages
  add column if not exists source_session_id uuid
    references public.counseling_sessions(id) on delete set null;

-- 세션별 발송된 리포트 조회 최적화
create index if not exists parent_messages_source_session_idx
  on public.parent_messages (source_session_id)
  where source_session_id is not null;

comment on column public.parent_messages.source_session_id is
  '이 메시지를 생성한 상담 세션 ID (counseling_sessions.id). 직접 작성 시 null.';
