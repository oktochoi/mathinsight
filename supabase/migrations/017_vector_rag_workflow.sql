-- Vector RAG (pgvector) + Multi-Agent Workflow (agent_jobs)

create extension if not exists vector;

-- ── Student memory chunks (768-dim Gemini embeddings) ──
create table if not exists public.student_memory_chunks (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'student_profile',
      'lesson_log',
      'consultation_card',
      'parent_report',
      'risk_signal',
      'schedule',
      'memo',
      'tag'
    )
  ),
  source_id uuid,
  title text not null default '',
  content text not null,
  embedding vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists student_memory_chunks_student_idx
  on public.student_memory_chunks (student_id, source_type);

create index if not exists student_memory_chunks_academy_idx
  on public.student_memory_chunks (academy_id);

create index if not exists student_memory_chunks_embedding_idx
  on public.student_memory_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Agent workflow jobs ──
create table if not exists public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  workflow_type text not null default 'student_care',
  current_step text not null default 'risk_detection',
  status text not null default 'pending' check (
    status in ('pending', 'running', 'completed', 'failed')
  ),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_jobs_academy_status_idx
  on public.agent_jobs (academy_id, status, updated_at desc);

create index if not exists agent_jobs_student_idx
  on public.agent_jobs (student_id, created_at desc);

-- ── Vector similarity search (cosine) ──
create or replace function public.match_student_memory_chunks(
  p_academy_id uuid,
  p_student_id uuid,
  query_embedding vector(768),
  match_count int default 10
)
returns table (
  id uuid,
  content text,
  source_type text,
  source_id uuid,
  title text,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.content,
    c.source_type,
    c.source_id,
    c.title,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from public.student_memory_chunks c
  where c.academy_id = p_academy_id
    and c.student_id = p_student_id
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_student_memory_chunks(uuid, uuid, vector, int) from public;
grant execute on function public.match_student_memory_chunks(uuid, uuid, vector, int) to authenticated;

-- ── RLS ──
alter table public.student_memory_chunks enable row level security;
alter table public.agent_jobs enable row level security;

drop policy if exists student_memory_chunks_staff on public.student_memory_chunks;
create policy student_memory_chunks_staff on public.student_memory_chunks
  for all to authenticated
  using (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  )
  with check (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );

drop policy if exists agent_jobs_staff on public.agent_jobs;
create policy agent_jobs_staff on public.agent_jobs
  for all to authenticated
  using (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  )
  with check (
    public.is_academy_staff()
    and academy_id = (select academy_id from public.users where id = auth.uid())
  );
