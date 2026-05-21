-- Auth 가입 시 public.users (및 원장이면 학원·반) 자동 생성
-- 이메일 인증 ON 상태에서도 클라이언트 INSERT 없이 프로필이 만들어집니다.

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
begin
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
    -- 이미 프로필이 있으면 무시 (재가입 시도 등)
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
