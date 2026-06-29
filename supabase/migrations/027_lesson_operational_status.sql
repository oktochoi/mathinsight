-- Lesson 운영 상태: in_progress, closed 추가 (held → closed 정규화)

alter table public.lessons drop constraint if exists lessons_status_check;

alter table public.lessons
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.users(id) on delete set null;

update public.lessons set status = 'closed' where status = 'held';

alter table public.lessons
  add constraint lessons_status_check
  check (status in ('scheduled', 'in_progress', 'closed', 'canceled'));

comment on column public.lessons.closed_at is '반·날짜 수업 마감 시각';
