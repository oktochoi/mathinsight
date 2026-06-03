-- EduFlow Agent Architecture: risk signals + agent logs (academy-scoped)

create table if not exists public.student_risk_signals (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  risk_level text not null check (
    risk_level in ('stable', 'attention', 'consultation', 'makeup', 'recovering')
  ),
  reason text not null default '',
  signals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists student_risk_signals_student_created_idx
  on public.student_risk_signals (student_id, created_at desc);

create index if not exists student_risk_signals_academy_created_idx
  on public.student_risk_signals (academy_id, created_at desc);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  agent_type text not null check (
    agent_type in (
      'risk_detection',
      'counseling',
      'parent_communication',
      'dashboard',
      'parent_rag'
    )
  ),
  student_id uuid references public.students(id) on delete set null,
  status text not null default 'completed' check (
    status in ('running', 'completed', 'failed', 'pending')
  ),
  action text not null,
  result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_logs_academy_created_idx
  on public.agent_logs (academy_id, created_at desc);

create index if not exists agent_logs_type_created_idx
  on public.agent_logs (academy_id, agent_type, created_at desc);

alter table public.student_risk_signals enable row level security;
alter table public.agent_logs enable row level security;

-- Staff: same academy only
drop policy if exists student_risk_signals_staff_select on public.student_risk_signals;
create policy student_risk_signals_staff_select on public.student_risk_signals
  for select to authenticated
  using (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );

drop policy if exists student_risk_signals_staff_insert on public.student_risk_signals;
create policy student_risk_signals_staff_insert on public.student_risk_signals
  for insert to authenticated
  with check (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );

drop policy if exists agent_logs_staff_select on public.agent_logs;
create policy agent_logs_staff_select on public.agent_logs
  for select to authenticated
  using (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );

drop policy if exists agent_logs_staff_insert on public.agent_logs;
create policy agent_logs_staff_insert on public.agent_logs
  for insert to authenticated
  with check (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );
