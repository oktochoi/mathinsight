-- 학부모: 연결된 자녀의 memory chunk만 읽기 (Vector RAG 검색)

drop policy if exists student_memory_chunks_parent_read on public.student_memory_chunks;
create policy student_memory_chunks_parent_read on public.student_memory_chunks
  for select to authenticated
  using (
    exists (
      select 1
      from public.student_connections sc
      where sc.student_id = student_memory_chunks.student_id
        and sc.user_id = auth.uid()
        and sc.relationship in ('mother', 'father', 'guardian')
    )
  );
