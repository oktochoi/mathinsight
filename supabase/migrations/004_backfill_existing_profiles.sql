-- 기존 auth.users 중 public.users 행이 없는 계정에 프로필 생성
-- (002 트리거 적용 전에 가입한 계정용 — SQL Editor에서 002 실행 후 이 파일도 실행)

insert into public.users (id, email, name, role, academy_id)
select
  au.id,
  au.email,
  coalesce(nullif(trim(au.raw_user_meta_data->>'name'), ''), split_part(au.email, '@', 1)),
  case
    when coalesce(au.raw_user_meta_data->>'role', '') in ('admin', 'teacher', 'parent', 'student')
      then au.raw_user_meta_data->>'role'
    else 'parent'
  end,
  null
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id);

-- 원장(admin)인데 학원이 없고, 가입 시 academy_name 메타데이터가 있는 경우 학원·A반 생성
do $$
declare
  r record;
  new_academy_id uuid;
  academy_label text;
begin
  for r in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.users u on u.id = au.id
    where coalesce(au.raw_user_meta_data->>'role', '') = 'admin'
      and nullif(trim(au.raw_user_meta_data->>'academy_name'), '') is not null
      and (u.id is null or u.academy_id is null)
  loop
    academy_label := trim(r.raw_user_meta_data->>'academy_name');

    insert into public.academies (name, owner_id)
    values (academy_label, r.id)
    returning id into new_academy_id;

    insert into public.users (id, email, name, role, academy_id)
    values (
      r.id,
      r.email,
      coalesce(nullif(trim(r.raw_user_meta_data->>'name'), ''), split_part(r.email, '@', 1)),
      'admin',
      new_academy_id
    )
    on conflict (id) do update
      set role = 'admin', academy_id = excluded.academy_id;

    insert into public.classes (academy_id, teacher_id, name, grade)
    select new_academy_id, r.id, 'A반', '중1'
    where not exists (
      select 1 from public.classes c where c.academy_id = new_academy_id
    );
  end loop;
end;
$$;
