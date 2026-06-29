-- Phase 2: Counseling sessions (상담 예약·기록·후속조치)

create table if not exists public.counseling_sessions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  consultation_card_id uuid references public.consultation_cards(id) on delete set null,
  session_type text not null default 'learning'
    check (session_type in ('parent', 'student', 'learning', 'reregistration')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'followup_needed')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  next_session_at timestamptz,
  title text not null default '학습 상담',
  summary text,
  parent_message_draft text,
  followup_checklist jsonb not null default '[]'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists counseling_sessions_academy_scheduled_idx
  on public.counseling_sessions (academy_id, scheduled_at desc nulls last);
create index if not exists counseling_sessions_student_idx
  on public.counseling_sessions (student_id, created_at desc);

alter table public.counseling_sessions enable row level security;

create policy "counseling_sessions_academy_staff" on public.counseling_sessions for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "counseling_sessions_portal_read" on public.counseling_sessions for select using (
  public.user_connected_to_student(student_id)
);
