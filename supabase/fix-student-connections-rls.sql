-- 이메일 연결 시 "student_connections RLS" 오류가 날 때 SQL Editor에서 1회 실행
-- (013_staff_student_connections_write.sql 과 동일)

drop policy if exists "student_connections_insert_staff" on public.student_connections;
drop policy if exists "student_connections_update_staff" on public.student_connections;
drop policy if exists "student_connections_delete_staff" on public.student_connections;

create policy "student_connections_insert_staff"
  on public.student_connections
  for insert
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );

create policy "student_connections_update_staff"
  on public.student_connections
  for update
  using (
    exists (
      select 1 from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );

create policy "student_connections_delete_staff"
  on public.student_connections
  for delete
  using (
    exists (
      select 1 from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );
