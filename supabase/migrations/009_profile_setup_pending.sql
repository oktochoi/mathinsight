-- profile_setup = 'complete' 일 때만 public.users 자동 생성 (역할 선택 후 완료)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_academy_id uuid;
  user_role text;
  user_name text;
  academy_name text;
  setup text;
begin
  setup := coalesce(new.raw_user_meta_data->>'profile_setup', '');

  if setup <> 'complete' then
    return new;
  end if;

  user_role := coalesce(new.raw_user_meta_data->>'role', 'parent');
  user_name := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));
  academy_name := nullif(trim(new.raw_user_meta_data->>'academy_name'), '');

  if user_role = 'admin' and academy_name is not null then
    insert into public.academies (name, owner_id)
    values (academy_name, new.id)
    returning id into new_academy_id;

    insert into public.users (id, email, name, role, academy_id)
    values (new.id, new.email, user_name, 'admin', new_academy_id);

    insert into public.classes (academy_id, teacher_id, name, grade)
    values (new_academy_id, new.id, 'A반', '중1');
  else
    insert into public.users (id, email, name, role, academy_id)
    values (
      new.id,
      new.email,
      user_name,
      case
        when user_role in ('admin', 'teacher', 'parent', 'student') then user_role
        else 'parent'
      end,
      null
    );
  end if;

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

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
  setup text;
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

  setup := coalesce(au.raw_user_meta_data->>'profile_setup', '');

  if setup <> 'complete' then
    return jsonb_build_object('ok', false, 'error', 'profile_setup_pending');
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
