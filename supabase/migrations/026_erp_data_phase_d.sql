-- ERP Data Phase D: 휴무일, 학부모 메시지 parent_id, payments 연결, 동기화 트리거

create table if not exists public.academy_holidays (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  holiday_date date not null,
  name text not null,
  is_closed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (academy_id, holiday_date)
);

create index if not exists academy_holidays_academy_date_idx
  on public.academy_holidays (academy_id, holiday_date);

alter table public.parent_messages
  add column if not exists parent_id uuid references public.parents(id) on delete set null;

update public.parent_messages pm
set parent_id = p.id
from public.parents p
where p.user_id = pm.parent_user_id
  and p.academy_id = pm.academy_id
  and pm.parent_id is null;

alter table public.student_payments
  add column if not exists parent_id uuid references public.parents(id) on delete set null,
  add column if not exists enrollment_id uuid references public.student_enrollments(id) on delete set null;

update public.student_payments sp
set parent_id = psl.parent_id
from public.parent_student_links psl
join public.parents p on p.id = psl.parent_id
where psl.student_id = sp.student_id
  and p.is_billing_contact = true
  and sp.parent_id is null;

-- student_connections 승인 시 parents / links 자동 동기화
create or replace function public.sync_parent_from_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academy_id uuid;
  v_parent_id uuid;
  v_name text;
  v_email text;
begin
  if new.relationship not in ('mother', 'father', 'guardian') then
    return new;
  end if;

  select s.academy_id into v_academy_id
  from public.students s where s.id = new.student_id;

  select u.name, u.email into v_name, v_email
  from public.users u where u.id = new.user_id;

  select p.id into v_parent_id
  from public.parents p
  where p.academy_id = v_academy_id and p.user_id = new.user_id;

  if v_parent_id is null then
    insert into public.parents (academy_id, user_id, name, email)
    values (v_academy_id, new.user_id, coalesce(nullif(trim(v_name), ''), '학부모'), v_email)
    returning id into v_parent_id;
  end if;

  insert into public.parent_student_links (
    parent_id, student_id, relationship, is_primary
  )
  values (
    v_parent_id,
    new.student_id,
    new.relationship,
    not exists (
      select 1 from public.parent_student_links psl
      where psl.student_id = new.student_id
    )
  )
  on conflict (parent_id, student_id) do update
  set relationship = excluded.relationship;

  perform public.sync_student_portal_user_ids(new.student_id);
  return new;
end;
$$;

drop trigger if exists student_connections_sync_parent on public.student_connections;
create trigger student_connections_sync_parent
  after insert on public.student_connections
  for each row execute function public.sync_parent_from_connection();

-- class teacher_id 변경 시 class_teachers 동기화 (호환)
create or replace function public.sync_class_homeroom_teacher()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
begin
  if new.teacher_id is null then
    return new;
  end if;

  select sp.id into v_staff_id
  from public.staff_profiles sp
  where sp.user_id = new.teacher_id and sp.academy_id = new.academy_id;

  if v_staff_id is null then
    return new;
  end if;

  update public.class_teachers
  set end_date = current_date
  where class_id = new.id
    and role = 'homeroom'
    and end_date is null
    and staff_id <> v_staff_id;

  insert into public.class_teachers (class_id, staff_id, role, start_date)
  select new.id, v_staff_id, 'homeroom', current_date
  where not exists (
    select 1 from public.class_teachers ct
    where ct.class_id = new.id
      and ct.staff_id = v_staff_id
      and ct.role = 'homeroom'
      and ct.end_date is null
  );

  new.homeroom_teacher_id := v_staff_id;
  return new;
end;
$$;

drop trigger if exists classes_sync_homeroom on public.classes;
create trigger classes_sync_homeroom
  before insert or update of teacher_id on public.classes
  for each row execute function public.sync_class_homeroom_teacher();

-- students.class_id 변경 시 enrollment 동기화
create or replace function public.sync_student_enrollment_from_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.class_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.class_id is not distinct from new.class_id then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.class_id is not null and old.class_id <> new.class_id then
    update public.student_enrollments
    set status = 'transferred', end_date = current_date, end_reason = '반 변경'
    where student_id = new.id and status = 'active' and end_date is null;
  end if;

  insert into public.student_enrollments (
    academy_id, student_id, class_id, status, start_date
  )
  select new.academy_id, new.id, new.class_id, 'active', current_date
  where not exists (
    select 1 from public.student_enrollments e
    where e.student_id = new.id
      and e.class_id = new.class_id
      and e.status = 'active'
      and e.end_date is null
  );

  return new;
end;
$$;

drop trigger if exists students_sync_enrollment on public.students;
create trigger students_sync_enrollment
  after insert or update of class_id on public.students
  for each row execute function public.sync_student_enrollment_from_class();

-- lesson_logs 저장 시 lessons / attendance / scores upsert (앱이 lesson_logs만 써도 동기화)
create or replace function public.sync_lesson_log_to_normalized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson_id uuid;
  v_staff_id uuid;
begin
  select id into v_lesson_id
  from public.lessons
  where class_id = new.class_id and lesson_date = new.lesson_date;

  if v_lesson_id is null then
    select sp.id into v_staff_id
    from public.staff_profiles sp
    where sp.user_id = new.teacher_id and sp.academy_id = new.academy_id;

    insert into public.lessons (
      academy_id, class_id, lesson_date, teacher_id, staff_id, unit, status
    )
    values (
      new.academy_id, new.class_id, new.lesson_date, new.teacher_id, v_staff_id,
      coalesce(new.unit, ''), 'held'
    )
    on conflict (class_id, lesson_date) do update
    set
      teacher_id = coalesce(excluded.teacher_id, public.lessons.teacher_id),
      unit = case when excluded.unit <> '' then excluded.unit else public.lessons.unit end,
      updated_at = now()
    returning id into v_lesson_id;
  end if;

  new.lesson_id := v_lesson_id;

  insert into public.attendance_records (lesson_id, student_id, status, checked_by, checked_at, memo)
  values (v_lesson_id, new.student_id, new.attendance_status, new.teacher_id, now(), new.memo)
  on conflict (lesson_id, student_id) do update
  set status = excluded.status, checked_by = excluded.checked_by, memo = excluded.memo, checked_at = now();

  if new.test_score is not null then
    insert into public.lesson_scores (lesson_id, student_id, score, max_score)
    values (v_lesson_id, new.student_id, new.test_score, 100)
    on conflict (lesson_id, student_id) do update set score = excluded.score;
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_logs_sync_normalized on public.lesson_logs;
create trigger lesson_logs_sync_normalized
  before insert or update on public.lesson_logs
  for each row execute function public.sync_lesson_log_to_normalized();

-- RLS: academy_holidays
alter table public.academy_holidays enable row level security;

create policy "academy_holidays_staff" on public.academy_holidays for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "academy_holidays_portal_read" on public.academy_holidays for select using (
  exists (
    select 1 from public.students s
    where s.academy_id = academy_holidays.academy_id
      and public.user_connected_to_student(s.id)
  )
);

comment on table public.academy_holidays is '학원 휴무일';
comment on function public.sync_lesson_log_to_normalized() is 'lesson_logs → lessons/attendance/scores 자동 동기화';

-- 신규 학원·직원 자동 백필
create or replace function public.ensure_academy_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.academy_settings (academy_id) values (new.id) on conflict do nothing;

  if not exists (
    select 1 from public.academic_terms t where t.academy_id = new.id
  ) then
    insert into public.academic_terms (academy_id, name, start_date, end_date, is_current)
    values (
      new.id,
      to_char(now(), 'YYYY') || ' 학기',
      date_trunc('year', now())::date,
      (date_trunc('year', now()) + interval '1 year' - interval '1 day')::date,
      true
    );
  end if;

  return new;
end;
$$;

create or replace function public.ensure_staff_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role in ('admin', 'teacher') and new.academy_id is not null then
    insert into public.staff_profiles (user_id, academy_id, hire_date)
    values (new.id, new.academy_id, coalesce(new.created_at::date, current_date))
    on conflict (user_id) do update
    set academy_id = excluded.academy_id, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists academies_ensure_defaults on public.academies;
create trigger academies_ensure_defaults
  after insert on public.academies
  for each row execute function public.ensure_academy_defaults();

drop trigger if exists users_ensure_staff_profile on public.users;
create trigger users_ensure_staff_profile
  after insert or update of role, academy_id on public.users
  for each row execute function public.ensure_staff_profile_for_user();

-- 기존 users 백필 (마이그레이션 직후 누락 방지)
insert into public.staff_profiles (user_id, academy_id, hire_date)
select u.id, u.academy_id, u.created_at::date
from public.users u
where u.role in ('admin', 'teacher')
  and u.academy_id is not null
  and not exists (select 1 from public.staff_profiles sp where sp.user_id = u.id);
