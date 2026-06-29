-- Phase 1 ERP: exams, homework assignments, lesson_logs upsert support
-- lesson_logs remains source of truth for daily attendance/homework/score snapshots.

-- Dedupe before unique constraint (keep newest row per student/class/date).
-- Tie-break on id when created_at is identical (seed/demo often inserts same timestamp).
delete from public.lesson_logs
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by student_id, class_id, lesson_date
        order by created_at desc, id desc
      ) as rn
    from public.lesson_logs
  ) ranked
  where rn > 1
);

create unique index if not exists lesson_logs_student_class_date_uidx
  on public.lesson_logs (student_id, class_id, lesson_date);

-- ── Exams (formal tests) ──
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  subject text not null default '수학',
  unit_scope text,
  exam_date date not null,
  max_score integer not null default 100,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists exams_academy_date_idx on public.exams (academy_id, exam_date desc);
create index if not exists exams_class_idx on public.exams (class_id, exam_date desc);

create table if not exists public.exam_scores (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score integer,
  feedback_memo text,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create index if not exists exam_scores_student_idx on public.exam_scores (student_id);

-- ── Homework assignments (metadata; submissions sync to lesson_logs when marked) ──
create table if not exists public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  lesson_date date,
  unit text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists homework_assignments_class_due_idx
  on public.homework_assignments (class_id, due_date desc);

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.homework_assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'missing'
    check (status in ('complete', 'partial', 'missing')),
  feedback_memo text,
  lesson_log_id uuid references public.lesson_logs(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- RLS
alter table public.exams enable row level security;
alter table public.exam_scores enable row level security;
alter table public.homework_assignments enable row level security;
alter table public.homework_submissions enable row level security;

create policy "exams_academy_staff" on public.exams for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "exam_scores_academy_staff" on public.exam_scores for all using (
  exists (
    select 1 from public.exams e
    join public.students s on s.id = exam_scores.student_id
    where e.id = exam_scores.exam_id
      and e.academy_id = public.current_academy_id()
      and s.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
);

create policy "homework_assignments_academy_staff" on public.homework_assignments for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "homework_submissions_academy_staff" on public.homework_submissions for all using (
  exists (
    select 1 from public.homework_assignments ha
    join public.students s on s.id = homework_submissions.student_id
    where ha.id = homework_submissions.assignment_id
      and ha.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
);

-- Portal read (parent/student connected)
create policy "exams_portal_read" on public.exams for select using (
  exists (
    select 1 from public.students s
    where s.class_id = exams.class_id
      and public.user_connected_to_student(s.id)
  )
);

create policy "exam_scores_portal_read" on public.exam_scores for select using (
  public.user_connected_to_student(student_id)
);

create policy "homework_assignments_portal_read" on public.homework_assignments for select using (
  exists (
    select 1 from public.students s
    where s.class_id = homework_assignments.class_id
      and public.user_connected_to_student(s.id)
  )
);

create policy "homework_submissions_portal_read" on public.homework_submissions for select using (
  public.user_connected_to_student(student_id)
);
