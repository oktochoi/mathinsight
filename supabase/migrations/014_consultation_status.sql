-- 상담 카드: 실제 상담 진행 여부 추적

alter table public.consultation_cards
  add column if not exists consultation_status text not null default 'pending'
    check (consultation_status in ('pending', 'completed'));

alter table public.consultation_cards
  add column if not exists consulted_at timestamptz;

alter table public.consultation_cards
  add column if not exists consultation_note text;

comment on column public.consultation_cards.consultation_status is 'pending=카드만 저장, completed=상담 진행 완료';
comment on column public.consultation_cards.consulted_at is '상담 완료 처리 시각';
