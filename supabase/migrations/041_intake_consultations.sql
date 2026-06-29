-- Growth Pipeline: 신입 원생 상담 (intake consultations)

alter table public.counseling_sessions
  drop constraint if exists counseling_sessions_session_type_check;

alter table public.counseling_sessions
  add constraint counseling_sessions_session_type_check
  check (session_type in ('parent', 'student', 'learning', 'reregistration', 'intake'));

create table if not exists public.intake_consultations (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  counseling_session_id uuid references public.counseling_sessions(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  prospect_name text not null,
  grade text not null default '',
  school text,
  parent_name text,
  parent_phone text,
  interested_subjects text,
  preferred_class text,
  counselor_id uuid references public.users(id) on delete set null,
  acquisition_source text,
  acquisition_source_other text,
  intake_status text not null default 'scheduled'
    check (intake_status in (
      'scheduled', 'completed', 'registered', 'on_hold', 'not_registered', 'no_show'
    )),
  consultation_content text,
  parent_needs text,
  student_level text,
  recommended_class text,
  recommended_subject text,
  registration_likelihood text
    check (registration_likelihood is null or registration_likelihood in ('low', 'medium', 'high')),
  next_action text
    check (next_action is null or next_action in (
      'follow_up', 'level_test', 'trial_lesson', 'enrollment_guide', 'on_hold'
    )),
  followup_date date,
  registered boolean not null default false,
  not_registered_reason text,
  not_registered_reason_other text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intake_consultations_academy_created_idx
  on public.intake_consultations (academy_id, created_at desc);
create index if not exists intake_consultations_academy_status_idx
  on public.intake_consultations (academy_id, intake_status);
create index if not exists intake_consultations_acquisition_idx
  on public.intake_consultations (academy_id, acquisition_source)
  where acquisition_source is not null;

alter table public.students
  add column if not exists acquisition_source text,
  add column if not exists acquisition_source_other text;

alter table public.intake_consultations enable row level security;

create policy "intake_consultations_academy_staff" on public.intake_consultations
  for all using (
    academy_id = public.current_academy_id() and public.is_academy_staff()
  ) with check (
    academy_id = public.current_academy_id()
  );
