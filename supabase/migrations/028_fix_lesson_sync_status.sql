-- 027에서 lessons.status check가 held 제거 → sync 트리거가 held 삽입 시 저장 실패
-- lesson_logs 저장 시 새 lessons 행은 scheduled 로 생성
-- (앱: lib/ensureOperationalLesson.ts 도 동일하게 선생성 — 028 미적용 DB 폴백)

alter table public.lessons alter column status set default 'scheduled';

create or replace function public.sync_lesson_log_to_normalized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson_id uuid;
  v_staff_id uuid;
begin
  select id into v_lesson_id
  from public.lessons
  where class_id = new.class_id and lesson_date = new.lesson_date;

  if v_lesson_id is null then
    select sp.id into v_staff_id
    from public.staff_profiles sp
    where sp.user_id = new.teacher_id and sp.academy_id = new.academy_id;

    insert into public.lessons (
      academy_id, class_id, lesson_date, teacher_id, staff_id, unit, status
    )
    values (
      new.academy_id, new.class_id, new.lesson_date, new.teacher_id, v_staff_id,
      coalesce(new.unit, ''), 'scheduled'
    )
    on conflict (class_id, lesson_date) do update
    set
      teacher_id = coalesce(excluded.teacher_id, public.lessons.teacher_id),
      unit = case when excluded.unit <> '' then excluded.unit else public.lessons.unit end,
      updated_at = now()
    returning id into v_lesson_id;
  end if;

  new.lesson_id := v_lesson_id;

  insert into public.attendance_records (lesson_id, student_id, status, checked_by, checked_at, memo)
  values (v_lesson_id, new.student_id, new.attendance_status, new.teacher_id, now(), new.memo)
  on conflict (lesson_id, student_id) do update
  set status = excluded.status, checked_by = excluded.checked_by, memo = excluded.memo, checked_at = now();

  if new.test_score is not null then
    insert into public.lesson_scores (lesson_id, student_id, score, max_score)
    values (v_lesson_id, new.student_id, new.test_score, 100)
    on conflict (lesson_id, student_id) do update set score = excluded.score;
  end if;

  return new;
end;
$$;
