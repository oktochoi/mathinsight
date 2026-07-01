-- 사용자별 푸시 알림 수신 설정
create table if not exists public.user_notification_prefs (
  user_id    uuid primary key references public.users(id) on delete cascade,
  prefs      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_prefs enable row level security;

drop policy if exists "users manage own notification prefs" on public.user_notification_prefs;
create policy "users manage own notification prefs"
  on public.user_notification_prefs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
