-- MathInsight initial schema
-- Run in Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Academies
create table if not exists public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Users (profile; id matches auth.users.id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'teacher', 'parent', 'student')),
  academy_id uuid references public.academies(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  name text not null,
  grade text not null,
  created_at timestamptz not null default now()
);

-- Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  parent_user_id uuid references public.users(id) on delete set null,
  student_user_id uuid references public.users(id) on delete set null,
  name text not null,
  school text,
  grade text not null,
  status text not null default 'stable' check (status in ('stable', 'attention', 'consultation')),
  created_at timestamptz not null default now()
);

-- Lesson logs
create table if not exists public.lesson_logs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  lesson_date date not null,
  unit text not null default '',
  attendance_status text not null check (attendance_status in ('present', 'late', 'absent')),
  homework_status text not null check (homework_status in ('complete', 'partial', 'missing')),
  test_score integer,
  tags text[] not null default '{}',
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists lesson_logs_student_date_idx on public.lesson_logs (student_id, lesson_date desc);
create index if not exists lesson_logs_academy_date_idx on public.lesson_logs (academy_id, lesson_date desc);
create index if not exists students_academy_idx on public.students (academy_id);

-- Consultation cards
create table if not exists public.consultation_cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  generated_by uuid references public.users(id) on delete set null,
  period_start date not null,
  period_end date not null,
  learning_summary text not null default '',
  evidence_summary text not null default '',
  consultation_points text[] not null default '{}',
  parent_message text not null default '',
  created_at timestamptz not null default now()
);

-- Parent reports
create table if not exists public.parent_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  generated_by uuid references public.users(id) on delete set null,
  period_start date not null,
  period_end date not null,
  tone text not null check (tone in ('friendly', 'objective', 'exam_focused', 'encouraging')),
  report_text text not null default '',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.academies enable row level security;
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.lesson_logs enable row level security;
alter table public.consultation_cards enable row level security;
alter table public.parent_reports enable row level security;

-- Helper: current user's academy
create or replace function public.current_academy_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select academy_id from public.users where id = auth.uid();
$$;

-- Users policies
create policy "users_select_own" on public.users for select using (id = auth.uid());
create policy "users_select_academy" on public.users for select using (
  academy_id = public.current_academy_id()
);
create policy "users_insert_own" on public.users for insert with check (id = auth.uid());
create policy "users_update_own" on public.users for update using (id = auth.uid());

-- Academies
create policy "academies_select_member" on public.academies for select using (
  id = public.current_academy_id() or owner_id = auth.uid()
);
create policy "academies_insert_owner" on public.academies for insert with check (owner_id = auth.uid());
create policy "academies_update_owner" on public.academies for update using (owner_id = auth.uid());

-- Classes
create policy "classes_academy_all" on public.classes for all using (
  academy_id = public.current_academy_id()
) with check (academy_id = public.current_academy_id());

-- Students
create policy "students_academy_staff" on public.students for all using (
  academy_id = public.current_academy_id()
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'teacher')
  )
) with check (academy_id = public.current_academy_id());

create policy "students_parent_read" on public.students for select using (
  parent_user_id = auth.uid()
);

create policy "students_student_read" on public.students for select using (
  student_user_id = auth.uid()
);

-- Lesson logs
create policy "lesson_logs_academy_staff" on public.lesson_logs for all using (
  academy_id = public.current_academy_id()
  and exists (
    select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher')
  )
) with check (academy_id = public.current_academy_id());

create policy "lesson_logs_parent_read" on public.lesson_logs for select using (
  exists (
    select 1 from public.students s
    where s.id = lesson_logs.student_id and s.parent_user_id = auth.uid()
  )
);

create policy "lesson_logs_student_read" on public.lesson_logs for select using (
  exists (
    select 1 from public.students s
    where s.id = lesson_logs.student_id and s.student_user_id = auth.uid()
  )
);

-- Consultation cards
create policy "consultation_staff" on public.consultation_cards for all using (
  exists (
    select 1 from public.students s
    where s.id = consultation_cards.student_id
      and s.academy_id = public.current_academy_id()
      and exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher'))
  )
) with check (
  exists (
    select 1 from public.students s
    where s.id = consultation_cards.student_id and s.academy_id = public.current_academy_id()
  )
);

create policy "consultation_parent_read" on public.consultation_cards for select using (
  exists (select 1 from public.students s where s.id = consultation_cards.student_id and s.parent_user_id = auth.uid())
);

-- Parent reports
create policy "parent_reports_staff" on public.parent_reports for all using (
  exists (
    select 1 from public.students s
    where s.id = parent_reports.student_id
      and s.academy_id = public.current_academy_id()
      and exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'teacher'))
  )
) with check (
  exists (
    select 1 from public.students s
    where s.id = parent_reports.student_id and s.academy_id = public.current_academy_id()
  )
);

create policy "parent_reports_parent_read" on public.parent_reports for select using (
  exists (select 1 from public.students s where s.id = parent_reports.student_id and s.parent_user_id = auth.uid())
);
