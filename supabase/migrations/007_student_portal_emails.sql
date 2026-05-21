-- 학생에 학부모/학생 연결 이메일 저장 (화면에 유지 + 연결 실패 시에도 표시)
alter table public.students
  add column if not exists parent_invite_email text,
  add column if not exists student_invite_email text;

-- 이메일로 parent/student 계정 조회 (RLS 우회, 원장·강사만)
create or replace function public.find_portal_user_by_email(p_email text, p_role text)
returns table (id uuid, email text, name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_academy_staff() then
    return;
  end if;

  if p_role not in ('parent', 'student') then
    return;
  end if;

  return query
  select u.id, u.email, u.name
  from public.users u
  where lower(trim(u.email)) = lower(trim(p_email))
    and u.role = p_role
  limit 1;
end;
$$;

revoke all on function public.find_portal_user_by_email(text, text) from public;
grant execute on function public.find_portal_user_by_email(text, text) to authenticated;
