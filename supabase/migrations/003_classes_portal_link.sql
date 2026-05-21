-- 반 삭제 시 학생 class_id NULL
alter table public.students drop constraint if exists students_class_id_fkey;
alter table public.students
  add constraint students_class_id_fkey
  foreign key (class_id) references public.classes(id) on delete set null;

-- 원장/강사가 학부모·학생 계정(이메일) 조회 — 포털 연결용
-- ※ users 안에서 users 를 SELECT 하면 RLS 무한 재귀 → 006 에서 is_academy_staff() 로 정책 생성
-- (003 만 단독 실행한 경우 SQL Editor 에서 006_fix_users_rls_recursion.sql 실행)
