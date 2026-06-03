-- 학생 연결 코드 + 연결 요청/승인 (StudentConnection)

alter table public.students
  add column if not exists connection_code text;

create unique index if not exists students_connection_code_key
  on public.students (connection_code)
  where connection_code is not null;

-- 연결 코드 생성 (EDU-XXXX-NN)
create or replace function public.generate_student_connection_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  part1 text := '';
  part2 text;
  code text;
  i int;
  tries int := 0;
begin
  loop
    part1 := '';
    for i in 1..4 loop
      part1 := part1 || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    part2 := lpad((floor(random() * 90) + 10)::text, 2, '0');
    code := 'EDU-' || part1 || '-' || part2;
  exit when not exists (select 1 from public.students s where s.connection_code = code);
    tries := tries + 1;
    if tries > 50 then
      raise exception 'connection_code_generation_failed';
    end if;
  end loop;
  return code;
end;
$$;

create or replace function public.students_set_connection_code()
returns trigger
language plpgsql
as $$
begin
  if new.connection_code is null or trim(new.connection_code) = '' then
    new.connection_code := public.generate_student_connection_code();
  else
    new.connection_code := upper(trim(new.connection_code));
  end if;
  return new;
end;
$$;

drop trigger if exists students_connection_code_before_insert on public.students;
create trigger students_connection_code_before_insert
  before insert on public.students
  for each row execute function public.students_set_connection_code();

-- 기존 학생 코드 백필
update public.students
set connection_code = public.generate_student_connection_code()
where connection_code is null;

alter table public.students
  alter column connection_code set not null;

-- 승인된 연결
create table if not exists public.student_connections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  relationship text not null check (relationship in ('mother', 'father', 'guardian', 'student')),
  created_at timestamptz not null default now(),
  unique (student_id, user_id)
);

create unique index if not exists student_connections_one_per_relationship
  on public.student_connections (student_id, relationship);

create index if not exists student_connections_user_id_idx
  on public.student_connections (user_id);

-- 연결 요청
create table if not exists public.student_connection_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  relationship text not null check (relationship in ('mother', 'father', 'guardian', 'student')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create unique index if not exists student_connection_requests_one_pending
  on public.student_connection_requests (student_id, user_id)
  where status = 'pending';

create index if not exists student_connection_requests_academy_pending
  on public.student_connection_requests (student_id, status);

-- 포털 접근: student_connections 기준
create or replace function public.user_connected_to_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_connections sc
    where sc.student_id = p_student_id
      and sc.user_id = auth.uid()
  );
$$;

create or replace function public.user_parent_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_connections sc
    where sc.student_id = p_student_id
      and sc.user_id = auth.uid()
      and sc.relationship in ('mother', 'father', 'guardian')
  );
$$;

create or replace function public.user_is_student_self(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_connections sc
    where sc.student_id = p_student_id
      and sc.user_id = auth.uid()
      and sc.relationship = 'student'
  );
$$;

revoke all on function public.user_connected_to_student(uuid) from public;
revoke all on function public.user_parent_of_student(uuid) from public;
revoke all on function public.user_is_student_self(uuid) from public;
grant execute on function public.user_connected_to_student(uuid) to authenticated;
grant execute on function public.user_parent_of_student(uuid) to authenticated;
grant execute on function public.user_is_student_self(uuid) to authenticated;

-- 레거시 컬럼 동기화 (조회 호환)
create or replace function public.sync_student_portal_user_ids(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent uuid;
  v_student uuid;
begin
  select sc.user_id into v_parent
  from public.student_connections sc
  where sc.student_id = p_student_id
    and sc.relationship in ('mother', 'father', 'guardian')
  order by sc.created_at asc
  limit 1;

  select sc.user_id into v_student
  from public.student_connections sc
  where sc.student_id = p_student_id
    and sc.relationship = 'student'
  limit 1;

  update public.students
  set
    parent_user_id = v_parent,
    student_user_id = v_student,
    parent_invite_email = null,
    student_invite_email = null
  where id = p_student_id;
end;
$$;

-- 연결 요청 제출
create or replace function public.submit_student_connection_request(
  p_code text,
  p_relationship text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_student_id uuid;
  v_student record;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select role into v_role from public.users where id = v_uid;

  if p_relationship = 'student' then
    if v_role <> 'student' then
      return jsonb_build_object('ok', false, 'error', 'student_role_required');
    end if;
  elsif p_relationship in ('mother', 'father', 'guardian') then
    if v_role <> 'parent' then
      return jsonb_build_object('ok', false, 'error', 'parent_role_required');
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'invalid_relationship');
  end if;

  select s.id, s.academy_id into v_student
  from public.students s
  where upper(trim(s.connection_code)) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  v_student_id := v_student.id;

  if exists (
    select 1 from public.student_connections sc
    where sc.student_id = v_student_id and sc.user_id = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_connected');
  end if;

  if exists (
    select 1 from public.student_connections sc
    where sc.student_id = v_student_id and sc.relationship = p_relationship
  ) then
    return jsonb_build_object('ok', false, 'error', 'relationship_taken');
  end if;

  if exists (
    select 1 from public.student_connection_requests r
    where r.student_id = v_student_id
      and r.user_id = v_uid
      and r.status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'error', 'pending_exists');
  end if;

  insert into public.student_connection_requests (student_id, user_id, relationship, status)
  values (v_student_id, v_uid, p_relationship, 'pending');

  return jsonb_build_object(
    'ok', true,
    'student_id', v_student_id,
    'student_name', (select name from public.students where id = v_student_id)
  );
end;
$$;

-- 승인 / 거절
create or replace function public.review_student_connection_request(
  p_request_id uuid,
  p_approve boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  req record;
begin
  if v_uid is null or not public.is_academy_staff() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select r.*, s.academy_id
  into req
  from public.student_connection_requests r
  join public.students s on s.id = r.student_id
  where r.id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if req.academy_id <> public.current_academy_id() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'already_reviewed');
  end if;

  if p_approve then
    if exists (
      select 1 from public.student_connections sc
      where sc.student_id = req.student_id and sc.relationship = req.relationship
    ) then
      return jsonb_build_object('ok', false, 'error', 'relationship_taken');
    end if;

    insert into public.student_connections (student_id, user_id, relationship)
    values (req.student_id, req.user_id, req.relationship);

    perform public.sync_student_portal_user_ids(req.student_id);

    update public.student_connection_requests
    set status = 'approved', reviewed_at = now(), reviewed_by = v_uid
    where id = p_request_id;
  else
    update public.student_connection_requests
    set status = 'rejected', reviewed_at = now(), reviewed_by = v_uid
    where id = p_request_id;
  end if;

  return jsonb_build_object('ok', true, 'approved', p_approve);
end;
$$;

-- 코드 재발급
create or replace function public.regenerate_student_connection_code(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_academy_staff() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if not exists (
    select 1 from public.students s
    where s.id = p_student_id and s.academy_id = public.current_academy_id()
  ) then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_code := public.generate_student_connection_code();
  update public.students set connection_code = v_code where id = p_student_id;

  return jsonb_build_object('ok', true, 'connection_code', v_code);
end;
$$;

revoke all on function public.submit_student_connection_request(text, text) from public;
revoke all on function public.review_student_connection_request(uuid, boolean) from public;
revoke all on function public.regenerate_student_connection_code(uuid) from public;
grant execute on function public.submit_student_connection_request(text, text) to authenticated;
grant execute on function public.review_student_connection_request(uuid, boolean) to authenticated;
grant execute on function public.regenerate_student_connection_code(uuid) to authenticated;

-- RLS: student_connections
alter table public.student_connections enable row level security;
alter table public.student_connection_requests enable row level security;

create policy "student_connections_select_own"
  on public.student_connections for select
  using (user_id = auth.uid());

create policy "student_connections_select_staff"
  on public.student_connections for select
  using (
    exists (
      select 1 from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );

create policy "student_connection_requests_select_own"
  on public.student_connection_requests for select
  using (user_id = auth.uid());

create policy "student_connection_requests_select_staff"
  on public.student_connection_requests for select
  using (
    exists (
      select 1 from public.students s
      where s.id = student_connection_requests.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );

-- students 포털 조회 (연결 기반)
drop policy if exists "students_parent_read" on public.students;
drop policy if exists "students_student_read" on public.students;

create policy "students_portal_read" on public.students for select using (
  public.user_connected_to_student(id)
);

-- lesson_logs
drop policy if exists "lesson_logs_parent_read" on public.lesson_logs;
drop policy if exists "lesson_logs_student_read" on public.lesson_logs;

create policy "lesson_logs_portal_read" on public.lesson_logs for select using (
  public.user_connected_to_student(student_id)
);

-- consultation_cards
drop policy if exists "consultation_parent_read" on public.consultation_cards;

create policy "consultation_portal_read" on public.consultation_cards for select using (
  public.user_parent_of_student(student_id)
);

-- parent_reports
drop policy if exists "parent_reports_parent_read" on public.parent_reports;

create policy "parent_reports_portal_read" on public.parent_reports for select using (
  public.user_parent_of_student(student_id)
);

-- schedules (008) — parent/student read via connection
drop policy if exists "class_schedules_parent_read" on public.class_schedules;
drop policy if exists "schedule_exceptions_parent_read" on public.schedule_exceptions;
drop policy if exists "class_schedules_student_read" on public.class_schedules;
drop policy if exists "schedule_exceptions_student_read" on public.schedule_exceptions;

create policy "class_schedules_portal_read" on public.class_schedules for select using (
  exists (
    select 1 from public.students s
    where s.class_id = class_schedules.class_id
      and public.user_connected_to_student(s.id)
  )
);

create policy "schedule_exceptions_portal_read" on public.schedule_exceptions for select using (
  exists (
    select 1 from public.students s
    where s.class_id = schedule_exceptions.class_id
      and public.user_connected_to_student(s.id)
  )
);

-- 기존 이메일로 연결된 학생 → student_connections 백필
insert into public.student_connections (student_id, user_id, relationship)
select s.id, s.parent_user_id, 'guardian'
from public.students s
where s.parent_user_id is not null
  and not exists (
    select 1 from public.student_connections sc
    where sc.student_id = s.id and sc.user_id = s.parent_user_id
  )
on conflict do nothing;

insert into public.student_connections (student_id, user_id, relationship)
select s.id, s.student_user_id, 'student'
from public.students s
where s.student_user_id is not null
  and not exists (
    select 1 from public.student_connections sc
    where sc.student_id = s.id and sc.relationship = 'student'
  )
on conflict do nothing;
