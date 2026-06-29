-- v_lesson_summary: lessons 행 기준으로 lesson_logs 통계를 집계하는 편의 뷰.
-- lesson_logs 가 여전히 출결·숙제·점수의 source of truth (028 sync 트리거 참조).
-- security_invoker = true → 조회자의 RLS 가 lessons / lesson_logs 양쪽에 적용됨.

create or replace view public.v_lesson_summary
  with (security_invoker = true)
as
select
  l.id                                                          as lesson_id,
  l.academy_id,
  l.class_id,
  l.lesson_date,
  l.unit,
  l.teacher_id,
  l.status                                                      as lesson_status,

  -- 학생 수
  count(ll.id)                                                  as total_students,

  -- 출결
  count(*) filter (where ll.attendance_status = 'present')     as present_count,
  count(*) filter (where ll.attendance_status = 'late')        as late_count,
  count(*) filter (where ll.attendance_status = 'absent')      as absent_count,

  -- 출석률 (결석·지각 제외) — present / total
  case
    when count(ll.id) = 0 then null
    else round(
      count(*) filter (where ll.attendance_status = 'present')::numeric
      / count(ll.id) * 100,
      1
    )
  end                                                           as attendance_rate,

  -- 숙제
  count(*) filter (where ll.homework_status = 'complete')      as homework_complete_count,
  count(*) filter (where ll.homework_status = 'partial')       as homework_partial_count,
  count(*) filter (where ll.homework_status = 'missing')       as homework_missing_count,

  -- 숙제 완료율
  case
    when count(ll.id) = 0 then null
    else round(
      count(*) filter (where ll.homework_status = 'complete')::numeric
      / count(ll.id) * 100,
      1
    )
  end                                                           as homework_rate,

  -- 점수
  count(*) filter (where ll.test_score is not null)            as scored_count,
  round(avg(ll.test_score) filter (where ll.test_score is not null), 1) as avg_score,
  max(ll.test_score)                                            as max_score,
  min(ll.test_score) filter (where ll.test_score is not null)  as min_score

from public.lessons l
left join public.lesson_logs ll
  on  ll.class_id    = l.class_id
  and ll.lesson_date = l.lesson_date
  and ll.academy_id  = l.academy_id
group by
  l.id,
  l.academy_id,
  l.class_id,
  l.lesson_date,
  l.unit,
  l.teacher_id,
  l.status;

comment on view public.v_lesson_summary is
  'lessons 행 당 집계 통계 (출석률, 숙제완료율, 평균점수). lesson_logs 기반.';
