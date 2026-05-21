-- 로그인·가입 직후 프로필이 없을 때 복구 (트리거 미적용/실패 대비)
-- 클라이언트: supabase.rpc('ensure_user_profile')

create or replace function public.ensure_user_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  au record;
  new_academy_id uuid;
  user_role text;
  user_name text;
  academy_name text;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if exists (select 1 from public.users where id = uid) then
    return jsonb_build_object('ok', true, 'created', false);
  end if;

  select id, email, raw_user_meta_data
  into au
  from auth.users
  where id = uid;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'auth_user_not_found');
  end if;

  user_role := coalesce(au.raw_user_meta_data->>'role', 'parent');
  user_name := coalesce(nullif(trim(au.raw_user_meta_data->>'name'), ''), split_part(au.email, '@', 1));
  academy_name := nullif(trim(au.raw_user_meta_data->>'academy_name'), '');

  if user_role = 'admin' and academy_name is not null then
    insert into public.academies (name, owner_id)
    values (academy_name, uid)
    returning id into new_academy_id;

    insert into public.users (id, email, name, role, academy_id)
    values (uid, au.email, user_name, 'admin', new_academy_id);

    insert into public.classes (academy_id, teacher_id, name, grade)
    values (new_academy_id, uid, 'A반', '중1');
  else
    insert into public.users (id, email, name, role, academy_id)
    values (
      uid,
      au.email,
      user_name,
      case
        when user_role in ('admin', 'teacher', 'parent', 'student') then user_role
        else 'parent'
      end,
      null
    );
  end if;

  return jsonb_build_object('ok', true, 'created', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'created', false);
  when others then
    return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;

revoke all on function public.ensure_user_profile() from public;
grant execute on function public.ensure_user_profile() to authenticated;
