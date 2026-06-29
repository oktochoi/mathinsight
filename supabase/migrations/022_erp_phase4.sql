-- Phase 4: 결제, 알림, 캘린더 연동, 상담 STT, 재등록 예측 기반

-- ── 수강료 / 결제 ──
create table if not exists public.student_payments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  billing_month text,
  amount integer not null check (amount >= 0),
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue', 'waived')),
  paid_at timestamptz,
  payment_method text,
  memo text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists student_payments_academy_status_idx
  on public.student_payments (academy_id, status, due_date);
create index if not exists student_payments_student_idx
  on public.student_payments (student_id, due_date desc);

-- ── 알림 발송 로그 (SMS/카카오 — API 연동 전 데모·큐) ──
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  channel text not null check (channel in ('sms', 'kakao', 'in_app')),
  recipient_label text not null,
  recipient_user_id uuid references public.users(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  message text not null,
  template_key text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'demo')),
  error_message text,
  sent_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_academy_created_idx
  on public.notification_logs (academy_id, created_at desc);

-- ── 학원 연동 설정 (Google Calendar ICS, SMS/카카오) ──
create table if not exists public.academy_integrations (
  academy_id uuid primary key references public.academies(id) on delete cascade,
  google_calendar_enabled boolean not null default false,
  google_calendar_id text,
  ics_feed_token text not null default encode(gen_random_bytes(16), 'hex'),
  sms_enabled boolean not null default false,
  kakao_enabled boolean not null default false,
  sms_sender_name text,
  kakao_channel_name text,
  updated_at timestamptz not null default now()
);

-- ── 상담 STT / 녹음 ──
alter table public.counseling_sessions
  add column if not exists recording_url text,
  add column if not exists transcript text,
  add column if not exists transcript_source text
    check (transcript_source is null or transcript_source in ('manual', 'stt', 'ai_summary'));

-- ── 재등록 예측 스냅샷 (Risk Agent 보완) ──
create table if not exists public.retention_signals (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  score integer not null default 0,
  reason text not null,
  signals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists retention_signals_student_idx
  on public.retention_signals (student_id, created_at desc);

-- RLS
alter table public.student_payments enable row level security;
alter table public.notification_logs enable row level security;
alter table public.academy_integrations enable row level security;
alter table public.retention_signals enable row level security;

create policy "student_payments_staff" on public.student_payments for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "student_payments_portal_read" on public.student_payments for select using (
  public.user_parent_of_student(student_id)
);

create policy "notification_logs_staff" on public.notification_logs for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "academy_integrations_staff" on public.academy_integrations for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "retention_signals_staff" on public.retention_signals for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "retention_signals_portal_read" on public.retention_signals for select using (
  public.user_parent_of_student(student_id)
);
