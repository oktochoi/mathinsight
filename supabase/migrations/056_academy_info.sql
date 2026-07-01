-- 원장이 학부모 챗봇에 노출할 학원 정보를 입력하는 테이블
create table if not exists public.academy_info (
  id          uuid primary key default gen_random_uuid(),
  academy_id  uuid not null references public.academies(id) on delete cascade,
  category    text not null, -- 'intro' | 'curriculum' | 'fees' | 'rules' | 'teachers' | 'faq'
  title       text not null,
  content     text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists academy_info_academy_id_idx on public.academy_info(academy_id);

alter table public.academy_info enable row level security;

-- 원장·강사·데스크: 본인 학원만 CRUD
drop policy if exists "staff can manage academy_info" on public.academy_info;
create policy "staff can manage academy_info"
  on public.academy_info for all
  using (
    academy_id = public.current_academy_id()
    and public.is_academy_staff()
  )
  with check (
    academy_id = public.current_academy_id()
    and public.is_academy_staff()
  );

-- 학부모·학생: 연결된 학원의 활성 항목만 읽기 (챗봇 컨텍스트)
drop policy if exists "service role read academy_info" on public.academy_info;
drop policy if exists "academy_info_portal_read" on public.academy_info;
create policy "academy_info_portal_read"
  on public.academy_info for select
  using (
    is_active = true
    and exists (
      select 1 from public.students s
      where s.academy_id = academy_info.academy_id
        and public.user_connected_to_student(s.id)
    )
  );
