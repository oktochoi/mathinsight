-- users RLS 무한 재귀 수정
-- 원인: users_staff_lookup_portal 정책 안에서 public.users 를 다시 SELECT

create or replace function public.is_academy_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('admin', 'teacher')
      and academy_id is not null
  );
$$;

revoke all on function public.is_academy_staff() from public;
grant execute on function public.is_academy_staff() to authenticated;

drop policy if exists "users_staff_lookup_portal" on public.users;

create policy "users_staff_lookup_portal" on public.users
for select
using (
  role in ('parent', 'student')
  and public.is_academy_staff()
);

-- 다른 테이블 정책도 users 서브쿼리 대신 헬퍼 사용 (재귀·성능)
drop policy if exists "students_academy_staff" on public.students;
create policy "students_academy_staff" on public.students for all using (
  academy_id = public.current_academy_id()
  and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

drop policy if exists "lesson_logs_academy_staff" on public.lesson_logs;
create policy "lesson_logs_academy_staff" on public.lesson_logs for all using (
  academy_id = public.current_academy_id()
  and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

drop policy if exists "consultation_staff" on public.consultation_cards;
create policy "consultation_staff" on public.consultation_cards for all using (
  exists (
    select 1 from public.students s
    where s.id = consultation_cards.student_id
      and s.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.students s
    where s.id = consultation_cards.student_id and s.academy_id = public.current_academy_id()
  )
);

drop policy if exists "parent_reports_staff" on public.parent_reports;
create policy "parent_reports_staff" on public.parent_reports for all using (
  exists (
    select 1 from public.students s
    where s.id = parent_reports.student_id
      and s.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.students s
    where s.id = parent_reports.student_id and s.academy_id = public.current_academy_id()
  )
);
ㅅ