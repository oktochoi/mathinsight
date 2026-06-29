-- ERP Data Phase B: 수업(lessons) + 출결/점수 정규화
-- lesson_logs 는 일일 스냅샷·호환 레이어로 유지합니다.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_date date not null,
  teacher_id uuid references public.users(id) on delete set null,
  staff_id uuid references public.staff_profiles(id) on delete set null,
  unit text not null default '',
  topic text,
  lesson_memo text,
  status text not null default 'held'
    check (status in ('scheduled', 'held', 'canceled')),
  schedule_id uuid references public.class_schedules(id) on delete set null,
  exception_id uuid references public.schedule_exceptions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, lesson_date)
);

create index if not exists lessons_academy_date_idx
  on public.lessons (academy_id, lesson_date desc);
create index if not exists lessons_teacher_date_idx
  on public.lessons (teacher_id, lesson_date desc)
  where teacher_id is not null;
create index if not exists lessons_staff_date_idx
  on public.lessons (staff_id, lesson_date desc)
  where staff_id is not null;

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent')),
  checked_by uuid references public.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  memo text,
  unique (lesson_id, student_id)
);

create index if not exists attendance_records_student_idx
  on public.attendance_records (student_id, checked_at desc);

create table if not exists public.lesson_scores (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score integer not null,
  max_score integer not null default 100,
  feedback_memo text,
  created_at timestamptz not null default now(),
  unique (lesson_id, student_id),
  check (score >= 0),
  check (max_score > 0),
  check (score <= max_score)
);

create index if not exists lesson_scores_student_idx
  on public.lesson_scores (student_id, created_at desc);

-- lesson_logs ↔ lessons 연결 (점진 이관)
alter table public.lesson_logs
  add column if not exists lesson_id uuid references public.lessons(id) on delete set null;

create index if not exists lesson_logs_lesson_id_idx
  on public.lesson_logs (lesson_id)
  where lesson_id is not null;

-- ── lesson_logs → lessons 백필 ──
insert into public.lessons (academy_id, class_id, lesson_date, teacher_id, staff_id, unit, status)
select
  ll.academy_id,
  ll.class_id,
  ll.lesson_date,
  (array_agg(ll.teacher_id order by ll.created_at desc))[1],
  (
    select sp.id
    from public.staff_profiles sp
    where sp.user_id = (array_agg(ll.teacher_id order by ll.created_at desc))[1]
      and sp.academy_id = ll.academy_id
    limit 1
  ),
  coalesce(nullif(trim((array_agg(ll.unit order by ll.created_at desc))[1]), ''), ''),
  'held'
from public.lesson_logs ll
group by ll.academy_id, ll.class_id, ll.lesson_date
on conflict (class_id, lesson_date) do nothing;

update public.lesson_logs ll
set lesson_id = l.id
from public.lessons l
where l.academy_id = ll.academy_id
  and l.class_id = ll.class_id
  and l.lesson_date = ll.lesson_date
  and ll.lesson_id is null;

-- ── attendance_records 백필 ──
insert into public.attendance_records (lesson_id, student_id, status, checked_by, checked_at, memo)
select
  ll.lesson_id,
  ll.student_id,
  ll.attendance_status,
  ll.teacher_id,
  ll.created_at,
  ll.memo
from public.lesson_logs ll
where ll.lesson_id is not null
on conflict (lesson_id, student_id) do update
set
  status = excluded.status,
  checked_by = excluded.checked_by,
  memo = excluded.memo;

-- ── lesson_scores 백필 ──
insert into public.lesson_scores (lesson_id, student_id, score, max_score)
select ll.lesson_id, ll.student_id, ll.test_score, 100
from public.lesson_logs ll
where ll.lesson_id is not null
  and ll.test_score is not null
on conflict (lesson_id, student_id) do update
set score = excluded.score;

-- homework_submissions 에 lesson 연결 (optional)
alter table public.homework_submissions
  add column if not exists lesson_id uuid references public.lessons(id) on delete set null;

update public.homework_submissions hs
set lesson_id = ll.lesson_id
from public.lesson_logs ll
where hs.lesson_log_id = ll.id
  and ll.lesson_id is not null
  and hs.lesson_id is null;

-- ── RLS ──
alter table public.lessons enable row level security;
alter table public.attendance_records enable row level security;
alter table public.lesson_scores enable row level security;

create policy "lessons_academy_staff" on public.lessons for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "lessons_portal_read" on public.lessons for select using (
  exists (
    select 1 from public.students s
    where s.class_id = lessons.class_id
      and public.user_connected_to_student(s.id)
  )
);

create policy "attendance_records_staff" on public.attendance_records for all using (
  exists (
    select 1 from public.lessons l
    where l.id = attendance_records.lesson_id
      and l.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.lessons l
    where l.id = attendance_records.lesson_id
      and l.academy_id = public.current_academy_id()
  )
);

create policy "attendance_records_portal_read" on public.attendance_records for select using (
  public.user_connected_to_student(student_id)
);

create policy "lesson_scores_staff" on public.lesson_scores for all using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_scores.lesson_id
      and l.academy_id = public.current_academy_id()
  )
  and public.is_academy_staff()
) with check (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_scores.lesson_id
      and l.academy_id = public.current_academy_id()
  )
);

create policy "lesson_scores_portal_read" on public.lesson_scores for select using (
  public.user_connected_to_student(student_id)
);

comment on table public.lessons is '반×날짜 수업 회차 (출결·점수의 부모)';
comment on table public.attendance_records is '수업별 학생 출결';
comment on table public.lesson_scores is '수업별 일상 점수 (정기 시험은 exams)';
