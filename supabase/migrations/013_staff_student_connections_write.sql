-- 원장·강사: 이메일 연결 등 student_connections 직접 관리

drop policy if exists "student_connections_insert_staff" on public.student_connections;
drop policy if exists "student_connections_update_staff" on public.student_connections;
drop policy if exists "student_connections_delete_staff" on public.student_connections;

create policy "student_connections_insert_staff"
  on public.student_connections
  for insert
  with check (
    exists (
      select 1
      from public.students s
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
      select 1
      from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  )
  with check (
    exists (
      select 1
      from public.students s
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
      select 1
      from public.students s
      where s.id = student_connections.student_id
        and s.academy_id = public.current_academy_id()
        and public.is_academy_staff()
    )
  );
