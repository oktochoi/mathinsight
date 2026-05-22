-- 반별 수업 일정, 예외(보강/휴강), 상담 후 확인

create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  title text not null default '정기수업',
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  schedule_type text not null default 'regular'
    check (schedule_type in ('regular', 'makeup', 'special', 'canceled')),
  location text,
  memo text,
  is_recurring boolean not null default true,
  is_visible_to_parent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_schedules_class_idx on public.class_schedules (class_id);
create index if not exists class_schedules_academy_idx on public.class_schedules (academy_id);

create table if not exists public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_schedule_id uuid references public.class_schedules(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  exception_date date not null,
  exception_type text not null
    check (exception_type in ('makeup', 'canceled', 'time_changed', 'special')),
  start_time time,
  end_time time,
  memo text,
  is_visible_to_parent boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists schedule_exceptions_date_idx on public.schedule_exceptions (exception_date, class_id);

create table if not exists public.consultation_followups (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  consultation_card_id uuid references public.consultation_cards(id) on delete set null,
  title text not null default '상담 후 확인',
  memo text not null default '',
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultation_followups_student_idx on public.consultation_followups (student_id);

alter table public.class_schedules enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.consultation_followups enable row level security;

-- Staff: academy schedules
create policy "class_schedules_staff" on public.class_schedules for all using (
  academy_id = public.current_academy_id()
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher'))
) with check (academy_id = public.current_academy_id());

create policy "schedule_exceptions_staff" on public.schedule_exceptions for all using (
  academy_id = public.current_academy_id()
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher'))
) with check (academy_id = public.current_academy_id());

create policy "consultation_followups_staff" on public.consultation_followups for all using (
  academy_id = public.current_academy_id()
  and exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher'))
) with check (academy_id = public.current_academy_id());

-- Parent: visible schedules for child's class
create policy "class_schedules_parent_read" on public.class_schedules for select using (
  is_visible_to_parent = true
  and exists (
    select 1 from public.students s
    where s.class_id = class_schedules.class_id and s.parent_user_id = auth.uid()
  )
);

create policy "schedule_exceptions_parent_read" on public.schedule_exceptions for select using (
  is_visible_to_parent = true
  and exists (
    select 1 from public.students s
    where s.class_id = schedule_exceptions.class_id and s.parent_user_id = auth.uid()
  )
);

-- Student: visible schedules for own class
create policy "class_schedules_student_read" on public.class_schedules for select using (
  is_visible_to_parent = true
  and exists (
    select 1 from public.students s
    where s.class_id = class_schedules.class_id and s.student_user_id = auth.uid()
  )
);

create policy "schedule_exceptions_student_read" on public.schedule_exceptions for select using (
  is_visible_to_parent = true
  and exists (
    select 1 from public.students s
    where s.class_id = schedule_exceptions.class_id and s.student_user_id = auth.uid()
  )
);
