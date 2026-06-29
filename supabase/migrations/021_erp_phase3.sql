-- Phase 3: 공지, 학부모 문의, 진도 관리

-- ── 공지 ──
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  title text not null,
  body text not null,
  target_type text not null default 'all'
    check (target_type in ('all', 'class', 'student')),
  class_id uuid references public.classes(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcements_academy_published_idx
  on public.announcements (academy_id, published_at desc nulls last);

-- ── 학부모 문의 ──
create table if not exists public.parent_messages (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  parent_user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'answered')),
  staff_reply text,
  ai_draft_reply text,
  replied_by uuid references public.users(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists parent_messages_academy_status_idx
  on public.parent_messages (academy_id, status, created_at desc);
create index if not exists parent_messages_parent_idx
  on public.parent_messages (parent_user_id, created_at desc);

-- ── 진도: 단원 마스터 + 반별 현재 진도 ──
create table if not exists public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  subject text not null default '수학',
  grade text not null,
  unit_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (academy_id, subject, grade, unit_name)
);

create table if not exists public.class_progress (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade unique,
  curriculum_unit_id uuid references public.curriculum_units(id) on delete set null,
  unit_name text not null,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
alter table public.parent_messages enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.class_progress enable row level security;

-- Staff
create policy "announcements_academy_staff" on public.announcements for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "parent_messages_academy_staff" on public.parent_messages for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "curriculum_units_academy_staff" on public.curriculum_units for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "class_progress_academy_staff" on public.class_progress for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

-- Portal: 공지 읽기
create policy "announcements_portal_read" on public.announcements for select using (
  status = 'published'
  and (
    (
      target_type = 'all'
      and exists (
        select 1 from public.students s
        where s.academy_id = announcements.academy_id
          and public.user_connected_to_student(s.id)
      )
    )
    or (
      target_type = 'class'
      and announcements.class_id is not null
      and exists (
        select 1 from public.students s
        where s.class_id = announcements.class_id
          and public.user_connected_to_student(s.id)
      )
    )
    or (
      target_type = 'student'
      and announcements.student_id is not null
      and public.user_connected_to_student(announcements.student_id)
    )
  )
);

-- Portal: 학부모 문의
create policy "parent_messages_parent_insert" on public.parent_messages for insert with check (
  parent_user_id = auth.uid()
  and exists (
    select 1 from public.students s
    where s.id = parent_messages.student_id
      and s.academy_id = parent_messages.academy_id
      and public.user_parent_of_student(s.id)
  )
);

create policy "parent_messages_parent_read" on public.parent_messages for select using (
  parent_user_id = auth.uid()
);

create policy "curriculum_units_portal_read" on public.curriculum_units for select using (
  exists (
    select 1 from public.students s
    where s.academy_id = curriculum_units.academy_id
      and public.user_connected_to_student(s.id)
  )
);

create policy "class_progress_portal_read" on public.class_progress for select using (
  exists (
    select 1 from public.students s
    where s.class_id = class_progress.class_id
      and public.user_connected_to_student(s.id)
  )
);
