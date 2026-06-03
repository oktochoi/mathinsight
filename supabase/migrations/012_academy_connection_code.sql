-- 학원당 연결 코드 1개 + 학생 이름으로 연결 요청 → 원장 승인 시 학생 지정

-- ---------------------------------------------------------------------------
-- 1. 연결 코드 생성 (학원·레거시 학생 코드와 중복 없음)
-- ---------------------------------------------------------------------------
create or replace function public.generate_connection_code()
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
    exit when not exists (
      select 1 from public.academies a where a.connection_code = code
    )
    and not exists (
      select 1 from public.students s where s.connection_code = code
    );
    tries := tries + 1;
    if tries > 50 then
      raise exception 'connection_code_generation_failed';
    end if;
  end loop;
  return code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. academies.connection_code
-- ---------------------------------------------------------------------------
alter table public.academies
  add column if not exists connection_code text;

create unique index if not exists academies_connection_code_key
  on public.academies (connection_code)
  where connection_code is not null;

update public.academies
set connection_code = public.generate_connection_code()
where connection_code is null;

alter table public.academies
  alter column connection_code set not null;

create or replace function public.academies_set_connection_code()
returns trigger
language plpgsql
as $$
begin
  if new.connection_code is null or trim(new.connection_code) = '' then
    new.connection_code := public.generate_connection_code();
  else
    new.connection_code := upper(trim(new.connection_code));
  end if;
  return new;
end;
$$;

drop trigger if exists academies_connection_code_before_insert on public.academies;
create trigger academies_connection_code_before_insert
  before insert on public.academies
  for each row execute function public.academies_set_connection_code();

-- ---------------------------------------------------------------------------
-- 3. 연결 요청: 학원 + 학생 이름 (승인 전 student_id 선택적)
-- ---------------------------------------------------------------------------
alter table public.student_connection_requests
  add column if not exists academy_id uuid references public.academies(id) on delete cascade,
  add column if not exists requested_student_name text;

update public.student_connection_requests r
set
  academy_id = s.academy_id,
  requested_student_name = coalesce(r.requested_student_name, s.name)
from public.students s
where s.id = r.student_id
  and (r.academy_id is null or r.requested_student_name is null);

alter table public.student_connection_requests
  alter column student_id drop not null;

drop index if exists public.student_connection_requests_one_pending;

create unique index if not exists student_connection_requests_one_pending
  on public.student_connection_requests (
    academy_id,
    user_id,
    lower(trim(requested_student_name))
  )
  where status = 'pending';

create index if not exists student_connection_requests_academy_status_idx
  on public.student_connection_requests (academy_id, status);

-- ---------------------------------------------------------------------------
-- 4. 학생별 자동 코드 비활성화 (레거시 컬럼은 유지)
-- ---------------------------------------------------------------------------
drop trigger if exists students_connection_code_before_insert on public.students;

alter table public.students
  alter column connection_code drop not null;

-- ---------------------------------------------------------------------------
-- 5. 연결 요청 제출 (학원 코드 + 학생 이름)
-- ---------------------------------------------------------------------------
drop function if exists public.submit_student_connection_request(text, text);

create or replace function public.submit_student_connection_request(
  p_code text,
  p_relationship text,
  p_student_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_academy_id uuid;
  v_academy_name text;
  v_student_name text;
  v_student_id uuid;
  v_match_count int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_student_name := nullif(trim(p_student_name), '');
  if v_student_name is null then
    return jsonb_build_object('ok', false, 'error', 'student_name_required');
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

  select a.id, a.name
  into v_academy_id, v_academy_name
  from public.academies a
  where upper(trim(a.connection_code)) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select count(*)::int, min(s.id)
  into v_match_count, v_student_id
  from public.students s
  where s.academy_id = v_academy_id
    and lower(trim(s.name)) = lower(v_student_name);

  if v_match_count > 1 then
    v_student_id := null;
  end if;

  if v_student_id is not null and exists (
    select 1 from public.student_connections sc
    where sc.student_id = v_student_id and sc.user_id = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_connected');
  end if;

  if v_student_id is not null and exists (
    select 1 from public.student_connections sc
    where sc.student_id = v_student_id and sc.relationship = p_relationship
  ) then
    return jsonb_build_object('ok', false, 'error', 'relationship_taken');
  end if;

  if exists (
    select 1 from public.student_connection_requests r
    where r.academy_id = v_academy_id
      and r.user_id = v_uid
      and lower(trim(r.requested_student_name)) = lower(v_student_name)
      and r.status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'error', 'pending_exists');
  end if;

  insert into public.student_connection_requests (
    academy_id,
    student_id,
    user_id,
    relationship,
    requested_student_name,
    status
  )
  values (
    v_academy_id,
    v_student_id,
    v_uid,
    p_relationship,
    v_student_name,
    'pending'
  );

  return jsonb_build_object(
    'ok', true,
    'academy_id', v_academy_id,
    'academy_name', v_academy_name,
    'student_id', v_student_id,
    'student_name', v_student_name,
    'needs_student_pick', v_student_id is null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. 승인·거절 (미지정 시 원장이 학생 선택)
-- ---------------------------------------------------------------------------
drop function if exists public.review_student_connection_request(uuid, boolean);

create or replace function public.review_student_connection_request(
  p_request_id uuid,
  p_approve boolean,
  p_student_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  req record;
  v_student_id uuid;
begin
  if v_uid is null or not public.is_academy_staff() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select r.*, coalesce(r.academy_id, s.academy_id) as resolved_academy_id
  into req
  from public.student_connection_requests r
  left join public.students s on s.id = r.student_id
  where r.id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if req.resolved_academy_id <> public.current_academy_id() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'already_reviewed');
  end if;

  if p_approve then
    v_student_id := coalesce(p_student_id, req.student_id);

    if v_student_id is null then
      return jsonb_build_object('ok', false, 'error', 'student_required');
    end if;

    if not exists (
      select 1 from public.students s
      where s.id = v_student_id and s.academy_id = req.resolved_academy_id
    ) then
      return jsonb_build_object('ok', false, 'error', 'invalid_student');
    end if;

    if exists (
      select 1 from public.student_connections sc
      where sc.student_id = v_student_id and sc.relationship = req.relationship
    ) then
      return jsonb_build_object('ok', false, 'error', 'relationship_taken');
    end if;

    if exists (
      select 1 from public.student_connections sc
      where sc.student_id = v_student_id and sc.user_id = req.user_id
    ) then
      return jsonb_build_object('ok', false, 'error', 'already_connected');
    end if;

    insert into public.student_connections (student_id, user_id, relationship)
    values (v_student_id, req.user_id, req.relationship);

    perform public.sync_student_portal_user_ids(v_student_id);

    update public.student_connection_requests
    set
      status = 'approved',
      student_id = v_student_id,
      reviewed_at = now(),
      reviewed_by = v_uid
    where id = p_request_id;
  else
    update public.student_connection_requests
    set status = 'rejected', reviewed_at = now(), reviewed_by = v_uid
    where id = p_request_id;
  end if;

  return jsonb_build_object('ok', true, 'approved', p_approve);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. 학원 코드 재발급
-- ---------------------------------------------------------------------------
create or replace function public.regenerate_academy_connection_code(
  p_academy_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_academy_id uuid := coalesce(p_academy_id, public.current_academy_id());
  v_code text;
begin
  if not public.is_academy_staff() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_academy_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_academy_id <> public.current_academy_id() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_code := public.generate_connection_code();
  update public.academies set connection_code = v_code where id = v_academy_id;

  return jsonb_build_object('ok', true, 'connection_code', v_code);
end;
$$;

revoke all on function public.submit_student_connection_request(text, text, text) from public;
revoke all on function public.review_student_connection_request(uuid, boolean, uuid) from public;
revoke all on function public.regenerate_academy_connection_code(uuid) from public;
grant execute on function public.submit_student_connection_request(text, text, text) to authenticated;
grant execute on function public.review_student_connection_request(uuid, boolean, uuid) to authenticated;
grant execute on function public.regenerate_academy_connection_code(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. RLS: 학원 기준으로 연결 요청 조회
-- ---------------------------------------------------------------------------
drop policy if exists "student_connection_requests_select_staff" on public.student_connection_requests;

create policy "student_connection_requests_select_staff"
  on public.student_connection_requests for select
  using (
    public.is_academy_staff()
    and (
      student_connection_requests.academy_id = public.current_academy_id()
      or exists (
        select 1 from public.students s
        where s.id = student_connection_requests.student_id
          and s.academy_id = public.current_academy_id()
      )
    )
  );
