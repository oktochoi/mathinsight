-- ERP Data Phase C: 상담·리포트 academy_id, 위험 스냅샷 통합, 재등록

-- ── consultation_cards / parent_reports academy_id ──
alter table public.consultation_cards
  add column if not exists academy_id uuid references public.academies(id) on delete cascade;

update public.consultation_cards cc
set academy_id = s.academy_id
from public.students s
where s.id = cc.student_id and cc.academy_id is null;

alter table public.consultation_cards
  alter column academy_id set not null;

create index if not exists consultation_cards_academy_status_idx
  on public.consultation_cards (academy_id, consultation_status, created_at desc);

alter table public.parent_reports
  add column if not exists academy_id uuid references public.academies(id) on delete cascade,
  add column if not exists published_to_portal_at timestamptz;

update public.parent_reports pr
set academy_id = s.academy_id
from public.students s
where s.id = pr.student_id and pr.academy_id is null;

alter table public.parent_reports
  alter column academy_id set not null;

create index if not exists parent_reports_academy_idx
  on public.parent_reports (academy_id, created_at desc);

-- 상담 FK 보강
alter table public.counseling_sessions
  add column if not exists counselor_id uuid references public.staff_profiles(id) on delete set null,
  add column if not exists parent_id uuid references public.parents(id) on delete set null,
  add column if not exists enrollment_id uuid references public.student_enrollments(id) on delete set null;

update public.counseling_sessions cs
set counselor_id = sp.id
from public.staff_profiles sp
where cs.created_by = sp.user_id
  and cs.academy_id = sp.academy_id
  and cs.counselor_id is null;

-- ── 위험 스냅샷 통합 ──
create table if not exists public.student_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  snapshot_type text not null check (snapshot_type in ('learning', 'retention')),
  risk_level text not null,
  score integer not null default 0,
  reason text not null default '',
  signals jsonb not null default '[]'::jsonb,
  source_table text,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists student_risk_snapshots_student_type_idx
  on public.student_risk_snapshots (student_id, snapshot_type, created_at desc);

create index if not exists student_risk_snapshots_academy_type_idx
  on public.student_risk_snapshots (academy_id, snapshot_type, created_at desc);

-- student_risk_signals 이관
insert into public.student_risk_snapshots (
  academy_id, student_id, snapshot_type, risk_level, score, reason, signals, source_table, source_id, created_at
)
select
  srs.academy_id,
  srs.student_id,
  'learning',
  srs.risk_level,
  0,
  srs.reason,
  srs.signals,
  'student_risk_signals',
  srs.id,
  srs.created_at
from public.student_risk_signals srs;

-- retention_signals 이관
insert into public.student_risk_snapshots (
  academy_id, student_id, snapshot_type, risk_level, score, reason, signals, source_table, source_id, created_at
)
select
  rs.academy_id,
  rs.student_id,
  'retention',
  rs.risk_level,
  rs.score,
  rs.reason,
  rs.signals,
  'retention_signals',
  rs.id,
  rs.created_at
from public.retention_signals rs;

-- ── 재등록 기록 ──
create table if not exists public.reregistration_records (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid references public.academic_terms(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'confirmed', 'declined', 'deferred')),
  counseling_session_id uuid references public.counseling_sessions(id) on delete set null,
  parent_id uuid references public.parents(id) on delete set null,
  decided_at timestamptz,
  decline_reason text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reregistration_records_academy_status_idx
  on public.reregistration_records (academy_id, status, updated_at desc);

create index if not exists reregistration_records_student_idx
  on public.reregistration_records (student_id, created_at desc);

-- 현재 학기 + high/medium retention → pending 재등록 레코드 (1회성 백필)
insert into public.reregistration_records (academy_id, student_id, term_id, status, memo)
select
  latest.academy_id,
  latest.student_id,
  t.id,
  'pending',
  latest.reason
from (
  select distinct on (rs.student_id)
    rs.academy_id,
    rs.student_id,
    rs.reason
  from public.retention_signals rs
  where rs.risk_level in ('high', 'medium')
  order by rs.student_id, rs.created_at desc
) latest
join public.academic_terms t on t.academy_id = latest.academy_id and t.is_current = true
where not exists (
  select 1 from public.reregistration_records rr
  where rr.student_id = latest.student_id and rr.term_id = t.id
);

-- ── 최신 위험 스냅샷 뷰 (대시보드·강사용) ──
create or replace view public.v_student_latest_risk as
select distinct on (s.student_id, s.snapshot_type)
  s.*
from public.student_risk_snapshots s
order by s.student_id, s.snapshot_type, s.created_at desc;

-- ── 강사 담당 학생 뷰 ──
create or replace view public.v_teacher_students as
select
  sp.user_id as teacher_user_id,
  sp.id as staff_id,
  s.id as student_id,
  s.academy_id,
  s.name as student_name,
  s.grade,
  c.id as class_id,
  c.name as class_name,
  ct.role as teacher_role
from public.staff_profiles sp
join public.class_teachers ct on ct.staff_id = sp.id and ct.end_date is null
join public.classes c on c.id = ct.class_id
join public.student_enrollments e on e.class_id = c.id and e.status = 'active' and e.end_date is null
join public.students s on s.id = e.student_id
where sp.employment_status = 'active';

-- ── RLS ──
alter table public.student_risk_snapshots enable row level security;
alter table public.reregistration_records enable row level security;

create policy "student_risk_snapshots_staff" on public.student_risk_snapshots for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

create policy "student_risk_snapshots_portal_read" on public.student_risk_snapshots for select using (
  snapshot_type = 'retention' and public.user_parent_of_student(student_id)
);

create policy "reregistration_records_staff" on public.reregistration_records for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

-- consultation_cards / parent_reports 정책 단순화 (academy_id 직접)
drop policy if exists "consultation_staff" on public.consultation_cards;
create policy "consultation_staff" on public.consultation_cards for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

drop policy if exists "parent_reports_staff" on public.parent_reports;
create policy "parent_reports_staff" on public.parent_reports for all using (
  academy_id = public.current_academy_id() and public.is_academy_staff()
) with check (academy_id = public.current_academy_id());

comment on table public.student_risk_snapshots is '학습·재등록 위험 스냅샷 (student_risk_signals + retention_signals 통합)';
comment on table public.reregistration_records is '학기별 재등록 의사·상담 연결';
