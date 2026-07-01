-- 반 추가 시 class_teachers FK 오류 수정
-- 원인: sync_class_homeroom_teacher()가 BEFORE INSERT 에서 class_teachers 에 넣는데,
--       아직 classes 행이 없어 class_teachers.class_id FK 가 실패함.

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
  where sp.user_id = new.teacher_id
    and sp.academy_id = new.academy_id;

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

  update public.classes
  set homeroom_teacher_id = v_staff_id
  where id = new.id
    and homeroom_teacher_id is distinct from v_staff_id;

  return new;
end;
$$;

drop trigger if exists classes_sync_homeroom on public.classes;
create trigger classes_sync_homeroom
  after insert or update of teacher_id on public.classes
  for each row execute function public.sync_class_homeroom_teacher();
