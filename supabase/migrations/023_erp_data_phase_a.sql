-- ERP Data Phase A: 조직·학생·보호자·담당·재원 이력
-- 기존 class_id / parent_user_id / teacher_id 는 호환용으로 유지합니다.

-- ── Academy 확장 ──
alter table public.academies
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended', 'closed')),
  add column if not exists timezone text not null default 'Asia/Seoul',
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists legal_name text;

create table if not exists public.academy_settings (
  academy_id uuid primary key references public.academies(id) on delete cascade,
  operating_hours jsonb not null default '{}'::jsonb,
  counseling_reregistration_days_before_term integer not null default 30,
  default_lesson_duration_min integer not null default 90,
  updated_at timestamptz not null default now()
);

insert into public.academy_settings (academy_id)
select a.id from public.academies a
where not exists (
  select 1 from public.academy_settings s where s.academy_id = a.id
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  capacity integer,
  floor_label text,
  memo text,
  created_at timestamptz not null default now(),
  unique (academy_id, name)
);

create index if not exists rooms_academy_idx on public.rooms (academy_id);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists academic_terms_academy_idx on public.academic_terms (academy_id, is_current);

-- 학원당 기본 학기 1개 (백필)
insert into public.academic_terms (academy_id, name, start_date, end_date, is_current)
select
  a.id,
  to_char(now(), 'YYYY') || ' 학기',
  date_trunc('year', now())::date,
  (date_trunc('year', now()) + interval '1 year' - interval '1 day')::date,
  true
from public.academies a
where not exists (
  select 1 from public.academic_terms t where t.academy_id = a.id
);

-- ── Staff (강사·원장 프로필) ──
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  academy_id uuid not null references public.academies(id) on delete cascade,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'on_leave', 'resigned')),
  phone text,
  hire_date date,
  resign_date date,
  permissions jsonb not null default '{}'::jsonb,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (academy_id, user_id)
);

create index if not exists staff_profiles_academy_idx
  on public.staff_profiles (academy_id, employment_status);

insert into public.staff_profiles (user_id, academy_id, hire_date)
select u.id, u.academy_id, u.created_at::date
from public.users u
where u.role in ('admin', 'teacher')
  and u.academy_id is not null
  and not exists (
    select 1 from public.staff_profiles sp where sp.user_id = u.id
  );

-- ── Parents (1급 보호자) ──
create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  address text,
  preferred_channel text not null default 'kakao'
    check (preferred_channel in ('sms', 'kakao', 'email', 'phone')),
  is_billing_contact boolean not null default false,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists parents_academy_user_uidx
  on public.parents (academy_id, user_id)
  where user_id is not null;

create index if not exists parents_academy_idx on public.parents (academy_id);

-- student_connections + users 에서 parents 백필
insert into public.parents (academy_id, user_id, name, email)
select distinct on (s.academy_id, sc.user_id)
  s.academy_id,
  sc.user_id,
  coalesce(nullif(trim(u.name), ''), '학부모'),
  u.email
from public.student_connections sc
join public.students s on s.id = sc.student_id
join public.users u on u.id = sc.user_id
where sc.relationship in ('mother', 'father', 'guardian')
order by s.academy_id, sc.user_id, sc.created_at asc;

insert into public.parents (academy_id, user_id, name, email)
select distinct on (s.academy_id, s.parent_user_id)
  s.academy_id,
  s.parent_user_id,
  coalesce(nullif(trim(u.name), ''), '학부모'),
  u.email
from public.students s
join public.users u on u.id = s.parent_user_id
where s.parent_user_id is not null
  and not exists (
    select 1 from public.parents p
    where p.academy_id = s.academy_id and p.user_id = s.parent_user_id
  )
order by s.academy_id, s.parent_user_id, s.created_at asc;

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text not null
    check (relationship in ('mother', 'father', 'guardian', 'other')),
  is_primary boolean not null default false,
  is_emergency_contact boolean not null default true,
  can_pickup boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create index if not exists parent_student_links_student_idx
  on public.parent_student_links (student_id);

-- student_connections → parent_student_links
insert into public.parent_student_links (
  parent_id, student_id, relationship, is_primary, is_emergency_contact
)
select
  p.id,
  sc.student_id,
  sc.relationship,
  sc.relationship = (
    select sc2.relationship
    from public.student_connections sc2
    where sc2.student_id = sc.student_id
      and sc2.relationship in ('mother', 'father', 'guardian')
    order by sc2.created_at asc
    limit 1
  ),
  true
from public.student_connections sc
join public.students s on s.id = sc.student_id
join public.parents p on p.academy_id = s.academy_id and p.user_id = sc.user_id
where sc.relationship in ('mother', 'father', 'guardian')
  and not exists (
    select 1 from public.parent_student_links psl
    where psl.parent_id = p.id and psl.student_id = sc.student_id
  );

-- ── Class 담당 (M:N) ──
create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  role text not null default 'homeroom'
    check (role in ('homeroom', 'assistant', 'substitute')),
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create unique index if not exists class_teachers_active_homeroom_uidx
  on public.class_teachers (class_id, role)
  where role = 'homeroom' and end_date is null;

create index if not exists class_teachers_staff_idx
  on public.class_teachers (staff_id)
  where end_date is null;

insert into public.class_teachers (class_id, staff_id, role, start_date)
select c.id, sp.id, 'homeroom', c.created_at::date
from public.classes c
join public.staff_profiles sp on sp.user_id = c.teacher_id and sp.academy_id = c.academy_id
where c.teacher_id is not null
  and not exists (
    select 1 from public.class_teachers ct
    where ct.class_id = c.id and ct.staff_id = sp.id and ct.role = 'homeroom'
  );

-- classes 확장
alter table public.classes
  add column if not exists subject text not null default '수학',
  add column if not exists status text not null default 'active'
    check (status in ('active', 'archived')),
  add column if not exists capacity integer,
  add column if not exists room_id uuid references public.rooms(id) on delete set null,
  add column if not exists term_id uuid references public.academic_terms(id) on delete set null,
  add column if not exists homeroom_teacher_id uuid references public.staff_profiles(id) on delete set null;

update public.classes c
set homeroom_teacher_id = sp.id
from public.staff_profiles sp
where c.teacher_id = sp.user_id
  and c.academy_id = sp.academy_id
  and c.homeroom_teacher_id is null;

-- ── Students 확장 + 재원 이력 ──
alter table public.students
  add column if not exists enrollment_status text not null default 'active'
    check (enrollment_status in ('prospect', 'active', 'on_leave', 'withdrawn', 'graduated')),
  add column if not exists registered_at date,
  add column if not exists withdrawn_at date,
  add column if not exists withdrawal_reason text,
  add column if not exists student_code text,
  add column if not exists birth_date date,
  add column if not exists gender text check (gender is null or gender in ('male', 'female', 'other')),
  add column if not exists special_notes text;

update public.students
set registered_at = coalesce(registered_at, created_at::date)
where registered_at is null;

create unique index if not exists students_academy_code_uidx
  on public.students (academy_id, student_code)
  where student_code is not null;

create index if not exists students_enrollment_status_idx
  on public.students (academy_id, enrollment_status);

create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  term_id uuid references public.academic_terms(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'ended', 'transferred')),
  start_date date not null default current_date,
  end_date date,
  end_reason text,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create unique index if not exists student_enrollments_one_active_uidx
  on public.student_enrollments (student_id)
  where status = 'active' and end_date is null;

create index if not exists student_enrollments_class_idx
  on public.student_enrollments (class_id, status);

insert into public.student_enrollments (academy_id, student_id, class_id, status, start_date)
select s.academy_id, s.id, s.class_id, 'active', coalesce(s.registered_at, s.created_at::date)
from public.students s
where s.class_id is not null
  and s.enrollment_status in ('prospect', 'active', 'on_leave')
  and not exists (
    select 1 from public.student_enrollments e
    where e.student_id = s.id and e.status = 'active' and e.end_date is null
  );

-- ── Helpers ──
create or replace function public.current_staff_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select sp.id
  from public.staff_profiles sp
  where sp.user_id = auth.uid()
    and sp.academy_id = public.current_academy_id()
    and sp.employment_status = 'active'
  limit 1;
$$;

create or replace function public.is_teacher_for_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.staff_profiles sp on sp.id = ct.staff_id
    where ct.class_id = p_class_id
      and sp.user_id = auth.uid()
      and ct.end_date is null
  )
  or exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.user_parent_record_for_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    join public.parents p on p.id = psl.parent_id
    where psl.student_id = p_student_id
      and p.user_id = auth.uid()
  )
  or public.user_parent_of_student(p_student_id);
$$;

revoke all on function public.current_staff_profile_id() from public;
revoke all on function public.is_teacher_for_class(uuid) from public;
revoke all on function public.user_parent_record_for_student(uuid) from public;
grant execute on function public.current_staff_profile_id() to authenticated;
grant execute on function public.is_teacher_for_class(uuid) to authenticated;
grant execute on function public.user_parent_record_for_student(uuid) to authenticated;

-- ── RLS ──
alter table public.academy_settings enable row level security;
alter table public.rooms enable row level security;
alter table public.academic_terms enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.parents enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.class_teachers enable row level security;
alter table public.student_enrollments enable row level security;

create policy "academy_settings_staff" on public.academy_settings for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "rooms_staff" on public.rooms for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "academic_terms_staff" on public.academic_terms for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "staff_profiles_staff" on public.staff_profiles for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "staff_profiles_self_read" on public.staff_profiles for select using (
  user_id = auth.uid()
);

create policy "parents_staff" on public.parents for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "parents_self_read" on public.parents for select using (
  user_id = auth.uid()
);

create policy "parent_student_links_staff" on public.parent_student_links for all using (
  exists (
    select 1 from public.students s
    join public.parents p on p.academy_id = s.academy_id
    where p.id = parent_student_links.parent_id
      and s.id = parent_student_links.student_id
      and s.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.students s
    where s.id = parent_student_links.student_id
      and s.academy_id = public.current_academy_id()
  )
);

create policy "parent_student_links_parent_read" on public.parent_student_links for select using (
  exists (
    select 1 from public.parents p
    where p.id = parent_student_links.parent_id and p.user_id = auth.uid()
  )
);

create policy "class_teachers_staff" on public.class_teachers for all using (
  exists (
    select 1 from public.classes c
    where c.id = class_teachers.class_id
      and c.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.classes c
    where c.id = class_teachers.class_id
      and c.academy_id = public.current_academy_id()
  )
);

create policy "student_enrollments_staff" on public.student_enrollments for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "student_enrollments_portal_read" on public.student_enrollments for select using (
  public.user_connected_to_student(student_id)
);

comment on table public.staff_profiles is '원장·강사 고용 프로필 (users 보완)';
comment on table public.parents is '학원 소속 보호자 CRM 엔티티';
comment on table public.parent_student_links is '보호자-학생 다대다 관계';
comment on table public.class_teachers is '반-강사 담당 (담임/보조/대체)';
comment on table public.student_enrollments is '학생 반 배정 이력';
