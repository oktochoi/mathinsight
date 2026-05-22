-- =============================================================================
-- MathInsight 발표 시연용 시드 데이터
-- =============================================================================
--
-- 【실행 전 필수】
-- 1. Supabase Dashboard → Authentication 에서 아래 3계정이 이미 가입되어 있어야 합니다.
--    - okto0914@gmail.com / okto0914!  (원장·강사 → admin)
--    - okto0915@gmail.com / okto0914!  (학부모 → parent)
--    - okto0916@gmail.com / okto0914!  (학생 → student)
-- 2. 마이그레이션 001~008 이 모두 적용된 상태여야 합니다.
--
-- 【실행 방법】
-- Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
--
-- 【주의】
-- - auth.users 는 삭제/삽입하지 않습니다. (SELECT 만 사용)
-- - public 테이블 데이터만 초기화 후 「옥토수학학원」 데모 데이터를 넣습니다.
-- - 다른 학원/학생 데이터는 모두 삭제됩니다. 프로덕션 DB에서는 실행하지 마세요.
--
-- 【실행 후 확인】
-- - okto0914 → 대시보드·시간표·박서연 학생 상세·상담 카드
-- - okto0915 → 박서연 학부모 포털
-- - okto0916 → 박서연 학생 포털
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Auth 계정 ID 조회 (3명 필수)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id   uuid;
  v_parent_id  uuid;
  v_student_id uuid;
  v_academy_id uuid;
  v_class_2a   uuid;
  v_class_3b   uuid;
  v_class_1h   uuid;
  v_stu_mj     uuid;
  v_stu_sy     uuid;
  v_stu_dy     uuid;
  v_stu_he     uuid;
  v_stu_wj     uuid;
  v_stu_jm     uuid;
  v_stu_os     uuid;
  v_stu_ms     uuid;
  v_stu_th     uuid;
  v_stu_jw     uuid;
  v_card_old   uuid;
  v_card_new   uuid;
  v_sched_2a_m uuid;
  v_sched_2a_w uuid;
  v_sched_3b_t uuid;
  v_sched_3b_r uuid;
  v_sched_1h_s uuid;
  v_next_sat   date;
  v_next_thu   date;
  v_d          date;
  v_i          int;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'okto0914@gmail.com' LIMIT 1;
  SELECT id INTO v_parent_id FROM auth.users WHERE lower(email) = 'okto0915@gmail.com' LIMIT 1;
  SELECT id INTO v_student_id FROM auth.users WHERE lower(email) = 'okto0916@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL OR v_parent_id IS NULL OR v_student_id IS NULL THEN
    RAISE EXCEPTION 'Auth 계정 3개(okto0914/0915/0916)가 모두 있어야 합니다. 먼저 앱에서 회원가입하세요.';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 1. 기존 public 데이터 삭제 (자식 → 부모 순)
  -- ---------------------------------------------------------------------------
  DELETE FROM public.consultation_followups;
  DELETE FROM public.schedule_exceptions;
  DELETE FROM public.class_schedules;
  DELETE FROM public.lesson_logs;
  DELETE FROM public.consultation_cards;
  DELETE FROM public.parent_reports;
  DELETE FROM public.students;
  DELETE FROM public.classes;
  DELETE FROM public.academies;

  -- 다른 테스트용 profile 정리 (3계정만 남김)
  DELETE FROM public.users
  WHERE id NOT IN (v_admin_id, v_parent_id, v_student_id);

  -- ---------------------------------------------------------------------------
  -- 2. Profiles upsert
  -- ---------------------------------------------------------------------------
  INSERT INTO public.users (id, email, name, role, academy_id)
  VALUES
    (v_admin_id, 'okto0914@gmail.com', '김원장', 'admin', NULL),
    (v_parent_id, 'okto0915@gmail.com', '박학부모', 'parent', NULL),
    (v_student_id, 'okto0916@gmail.com', '박서연', 'student', NULL)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

  -- ---------------------------------------------------------------------------
  -- 3. Academy
  -- ---------------------------------------------------------------------------
  v_academy_id := gen_random_uuid();
  INSERT INTO public.academies (id, name, owner_id)
  VALUES (v_academy_id, '옥토수학학원', v_admin_id);

  UPDATE public.users SET academy_id = v_academy_id WHERE id = v_admin_id;

  -- ---------------------------------------------------------------------------
  -- 4. Classes
  -- ---------------------------------------------------------------------------
  v_class_2a := gen_random_uuid();
  v_class_3b := gen_random_uuid();
  v_class_1h := gen_random_uuid();

  INSERT INTO public.classes (id, academy_id, teacher_id, name, grade) VALUES
    (v_class_2a, v_academy_id, v_admin_id, 'A반', '중2'),
    (v_class_3b, v_academy_id, v_admin_id, 'B반', '중3'),
    (v_class_1h, v_academy_id, v_admin_id, '수학반', '고1');

  -- 표시용 반 이름 (name만 풀네임)
  UPDATE public.classes SET name = '중2A반' WHERE id = v_class_2a;
  UPDATE public.classes SET name = '중3B반' WHERE id = v_class_3b;
  UPDATE public.classes SET name = '고1수학반' WHERE id = v_class_1h;

  -- ---------------------------------------------------------------------------
  -- 5. Students
  -- ---------------------------------------------------------------------------
  v_stu_mj := gen_random_uuid();
  v_stu_sy := gen_random_uuid();
  v_stu_dy := gen_random_uuid();
  v_stu_he := gen_random_uuid();
  v_stu_wj := gen_random_uuid();
  v_stu_jm := gen_random_uuid();
  v_stu_os := gen_random_uuid();
  v_stu_ms := gen_random_uuid();
  v_stu_th := gen_random_uuid();
  v_stu_jw := gen_random_uuid();

  INSERT INTO public.students (
    id, academy_id, class_id, parent_user_id, student_user_id,
    parent_invite_email, student_invite_email,
    name, school, grade, status
  ) VALUES
    (v_stu_mj, v_academy_id, v_class_2a, NULL, NULL, NULL, NULL, '김민준', '옥토중학교', '중2', 'stable'),
    (v_stu_sy, v_academy_id, v_class_2a, v_parent_id, v_student_id, 'okto0915@gmail.com', 'okto0916@gmail.com', '박서연', '옥토중학교', '중2', 'consultation'),
    (v_stu_dy, v_academy_id, v_class_2a, NULL, NULL, NULL, NULL, '이도윤', '옥토중학교', '중2', 'attention'),
    (v_stu_he, v_academy_id, v_class_2a, NULL, NULL, NULL, NULL, '최하은', '옥토중학교', '중2', 'stable'),
    (v_stu_wj, v_academy_id, v_class_3b, NULL, NULL, NULL, NULL, '정우진', '한빛중학교', '중3', 'stable'),
    (v_stu_jm, v_academy_id, v_class_3b, NULL, NULL, NULL, NULL, '한지민', '한빛중학교', '중3', 'stable'),
    (v_stu_os, v_academy_id, v_class_3b, NULL, NULL, NULL, NULL, '오시윤', '한빛중학교', '중3', 'attention'),
    (v_stu_ms, v_academy_id, v_class_1h, NULL, NULL, NULL, NULL, '강민서', '옥토고등학교', '고1', 'stable'),
    (v_stu_th, v_academy_id, v_class_1h, NULL, NULL, NULL, NULL, '윤태호', '옥토고등학교', '고1', 'stable'),
    (v_stu_jw, v_academy_id, v_class_1h, NULL, NULL, NULL, NULL, '서지우', '옥토고등학교', '고1', 'stable');

  -- ---------------------------------------------------------------------------
  -- 6. Class schedules (day_of_week: 0=일 … 6=토)
  -- ---------------------------------------------------------------------------
  v_sched_2a_m := gen_random_uuid();
  v_sched_2a_w := gen_random_uuid();
  v_sched_3b_t := gen_random_uuid();
  v_sched_3b_r := gen_random_uuid();
  v_sched_1h_s := gen_random_uuid();

  INSERT INTO public.class_schedules (
    id, academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_sched_2a_m, v_academy_id, v_class_2a, v_admin_id, '정기수업', 1, '19:00', '20:30', 'regular', '201호', true, true),
    (v_sched_2a_w, v_academy_id, v_class_2a, v_admin_id, '정기수업', 3, '19:00', '20:30', 'regular', '201호', true, true),
    (v_sched_3b_t, v_academy_id, v_class_3b, v_admin_id, '정기수업', 2, '19:30', '21:00', 'regular', '202호', true, true),
    (v_sched_3b_r, v_academy_id, v_class_3b, v_admin_id, '정기수업', 4, '19:30', '21:00', 'regular', '202호', true, true),
    (v_sched_1h_s, v_academy_id, v_class_1h, v_admin_id, '정기수업', 6, '10:00', '12:00', 'regular', '301호', true, true);

  -- ---------------------------------------------------------------------------
  -- 7. Schedule exceptions (보강·휴강)
  -- ---------------------------------------------------------------------------
  -- 이번 주 토요일 (오늘이 토요일이면 오늘)
  v_next_sat := current_date + ((6 - extract(dow from current_date)::int + 7) % 7);
  -- 다음 주 목요일 (월~수: 이번 주 목+7일 / 목: +7일 / 금~일: 다가오는 목)
  IF extract(dow from current_date) = 4 THEN
    v_next_thu := current_date + 7;
  ELSIF extract(dow from current_date) < 4 THEN
    v_next_thu := current_date + ((4 - extract(dow from current_date)::int + 7) % 7) + 7;
  ELSE
    v_next_thu := current_date + ((4 - extract(dow from current_date)::int + 7) % 7);
  END IF;

  INSERT INTO public.schedule_exceptions (
    academy_id, class_schedule_id, class_id, exception_date,
    exception_type, start_time, end_time, memo, is_visible_to_parent
  ) VALUES
    (v_academy_id, NULL, v_class_2a, v_next_sat, 'makeup', '15:00', '16:30', '중2A반 보강 (함수 그래프)', true),
    (v_academy_id, v_sched_3b_r, v_class_3b, v_next_thu, 'canceled', NULL, NULL, '중3B반 정기수업 휴강', true);

  -- ---------------------------------------------------------------------------
  -- 8. Lesson logs (최근 4주, 주 1회)
  -- ---------------------------------------------------------------------------

  -- 박서연: 82→76→68→72, 숙제 complete→partial→missing→missing
  FOR v_i IN 0..3 LOOP
    v_d := current_date - 21 + (v_i * 7);
    INSERT INTO public.lesson_logs (
      academy_id, class_id, student_id, teacher_id, lesson_date, unit,
      attendance_status, homework_status, test_score, tags, memo
    ) VALUES (
      v_academy_id, v_class_2a, v_stu_sy, v_admin_id, v_d,
      (ARRAY['일차함수', '함수의 그래프', '연립방정식', '함수의 그래프'])[v_i + 1],
      'present',
      (ARRAY['complete', 'partial', 'missing', 'missing']::text[])[v_i + 1],
      (ARRAY[82, 76, 68, 72])[v_i + 1],
      CASE v_i
        WHEN 0 THEN ARRAY['계산 실수']
        WHEN 1 THEN ARRAY['계산 실수', '개념 보완']
        ELSE ARRAY['계산 실수', '숙제 확인', '개념 보완']
      END,
      (ARRAY[
        '그래프 해석에서 계산 실수가 보였습니다.',
        '풀이 과정을 적으면서 속도가 느려졌습니다.',
        '숙제 미제출. 함수 그래프 해석 보완 필요.',
        '계산 실수 반복. 오답노트 확인 필요.'
      ])[v_i + 1]
    );
  END LOOP;

  -- 김민준: 점수 상승, 숙제 안정
  FOR v_i IN 0..3 LOOP
    v_d := (ARRAY[current_date - 21, current_date - 14, current_date - 7, current_date - 2])[v_i + 1];
    INSERT INTO public.lesson_logs (
      academy_id, class_id, student_id, teacher_id, lesson_date, unit,
      attendance_status, homework_status, test_score, tags, memo
    ) VALUES (
      v_academy_id, v_class_2a, v_stu_mj, v_admin_id, v_d, '일차함수',
      'present', 'complete', (ARRAY[72, 78, 81, 85])[v_i + 1],
      ARRAY['풀이 과정'], '풀이 과정 정리가 좋아지고 있습니다.'
    );
  END LOOP;

  -- 이도윤: 점수 변동, 숙제 안정
  FOR v_i IN 0..3 LOOP
    v_d := (ARRAY[current_date - 20, current_date - 13, current_date - 6, current_date - 1])[v_i + 1];
    INSERT INTO public.lesson_logs (
      academy_id, class_id, student_id, teacher_id, lesson_date, unit,
      attendance_status, homework_status, test_score, tags, memo
    ) VALUES (
      v_academy_id, v_class_2a, v_stu_dy, v_admin_id, v_d, '도형',
      'present', 'complete', (ARRAY[88, 75, 82, 70])[v_i + 1],
      ARRAY['응용 문제'], '응용 문제에서 시간이 부족한 편입니다.'
    );
  END LOOP;

  -- 최하은
  FOR v_i IN 0..2 LOOP
    v_d := (ARRAY[current_date - 18, current_date - 11, current_date - 4])[v_i + 1];
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_class_2a, v_stu_he, v_admin_id, v_d, '연립방정식', 'present', 'complete', 78 + v_i * 4, ARRAY['안정적'], '꾸준히 참여하고 있습니다.');
  END LOOP;

  -- 중3B반 학생들
  INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
  SELECT v_academy_id, v_class_3b, s.id, v_admin_id, current_date - (n * 7), '이차함수', 'present', 'complete',
    68 + n * 5, ARRAY['개념 보완'], '이차함수 단원 진행 중.'
  FROM (VALUES (v_stu_wj), (v_stu_jm), (v_stu_os)) AS s(id), generate_series(0, 3) AS n;

  -- 고1반 학생들
  INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
  SELECT v_academy_id, v_class_1h, s.id, v_admin_id, current_date - (n * 7), '함수의 그래프', 'present', 'complete',
    72 + n * 4, ARRAY['풀이 과정'], '토요일 수업 참여 양호.'
  FROM (VALUES (v_stu_ms), (v_stu_th), (v_stu_jw)) AS s(id), generate_series(0, 3) AS n;

  -- 오늘 중2A 일부만 기록 (오늘 수업 「기록 미입력」 데모용 — 박서연 반은 오늘 로그 없음)
  IF extract(dow from current_date) IN (1, 3) THEN
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES
      (v_academy_id, v_class_2a, v_stu_mj, v_admin_id, current_date, '함수의 그래프', 'present', 'complete', NULL, ARRAY['풀이 과정'], '오늘 수업 참여 좋음.'),
      (v_academy_id, v_class_2a, v_stu_dy, v_admin_id, current_date, '함수의 그래프', 'late', 'partial', NULL, ARRAY['응용 문제'], '지각 후 수업 복귀.');
  END IF;

  -- ---------------------------------------------------------------------------
  -- 9. Consultation cards (박서연 2건)
  -- ---------------------------------------------------------------------------
  v_card_old := gen_random_uuid();
  v_card_new := gen_random_uuid();

  INSERT INTO public.consultation_cards (
    id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at
  ) VALUES (
    v_card_old, v_stu_sy, v_admin_id,
    current_date - 28, current_date - 15,
    '함수 단원에서 계산 실수가 반복되었고, 숙제 제출이 불안정한 흐름이 기록되어 있습니다.',
    E'· ' || (current_date - 21)::text || ' / 함수의 그래프 / 출석 / 완료 / 82점 / 계산 실수\n· ' || (current_date - 14)::text || ' / 연립방정식 / 출석 / 부분 / 76점',
    ARRAY[
      '최근 숙제 흐름 확인',
      '계산 실수 원인 점검',
      '오답노트 작성 방식 안내'
    ],
    '서연이는 함수 단원에서 계산 실수가 반복되어 풀이 과정을 천천히 확인하는 연습이 필요합니다. 숙제 제출 흐름도 함께 점검하겠습니다.',
    now() - interval '14 days'
  );

  INSERT INTO public.consultation_cards (
    id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at
  ) VALUES (
    v_card_new, v_stu_sy, v_admin_id,
    current_date - 14, current_date,
    '최근 숙제 미제출 2회가 기록되었고, 점수는 하락 이후 일부 회복된 흐름입니다. 다음 수업에서 함수 그래프 해석을 다시 확인할 예정입니다.',
    E'· ' || (current_date - 7)::text || ' / 함수의 그래프 / 출석 / 미제출 / 68점\n· ' || (current_date - 1)::text || ' / 함수의 그래프 / 출석 / 미제출 / 72점',
    ARRAY[
      '최근 숙제 흐름 확인',
      '계산 실수 원인 점검',
      '오답노트 작성 방식 안내',
      '다음 수업에서 함수 그래프 해석 확인'
    ],
    '서연이는 최근 함수 단원에서 계산 실수가 반복되어 풀이 과정을 천천히 확인하는 연습이 필요합니다. 숙제 제출 흐름도 함께 점검하며 다음 수업에서 그래프 해석 부분을 다시 확인하겠습니다.',
    now() - interval '3 days'
  );

  -- ---------------------------------------------------------------------------
  -- 10. Parent report (박서연)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.parent_reports (
    student_id, generated_by, period_start, period_end, tone, report_text, created_at
  ) VALUES (
    v_stu_sy, v_admin_id, current_date - 14, current_date, 'friendly',
    E'안녕하세요, 옥토수학학원입니다. 박서연 학생 학습 리포트를 전달드립니다.

[이번 기간 한눈에]
이번 기간에는 함수·그래프 단원을 중심으로 수업이 진행되었습니다. 기록상 계산 실수가 반복되는 모습이 있어, 풀이 과정을 차근차근 확인하는 연습을 함께 하고 있습니다.

[수업에서 다룬 내용]
일차함수, 함수의 그래프, 연립방정식 단원을 다루었습니다.

[숙제와 학습 습관]
최근 숙제는 완료 → 부분 → 미제출로 이어졌습니다. 가정에서 제출 루틴을 함께 점검해 주시면 감사하겠습니다.

[평가·시험]
최근 점수는 82점 → 76점 → 68점 → 72점 순으로 기록되어 있습니다. 하락 이후 소폭 회복된 흐름입니다.

[함께 보면 좋은 부분]
오답노트에 틀린 이유를 한 줄씩 적는 습관을 권해 드립니다. 다음 수업에서 그래프 해석을 다시 확인하겠습니다.

[맺음말]
궁금하신 점은 언제든 연락 주세요. 옥토수학학원 드림',
    now() - interval '5 days'
  );

  -- ---------------------------------------------------------------------------
  -- 11. Consultation followups (상담 후 확인 — 박서연)
  -- ---------------------------------------------------------------------------
  INSERT INTO public.consultation_followups (
    academy_id, student_id, consultation_card_id, title, memo, due_date, status
  ) VALUES
    (v_academy_id, v_stu_sy, v_card_new, '함수 그래프 해석 확인', '다음 수업에서 그래프 해석 문제를 함께 풀어보기', current_date + 3, 'pending'),
    (v_academy_id, v_stu_sy, v_card_new, '오답노트 확인', '틀린 이유 한 줄 적기 루틴 점검', current_date + 7, 'pending'),
    (v_academy_id, v_stu_sy, v_card_new, '숙제 루틴 체크', '최근 미제출 2회 이후 제출 습관 확인', current_date + 5, 'pending');

  RAISE NOTICE '옥토수학학원 시연 데이터 적용 완료. academy_id=%', v_academy_id;
END $$;

COMMIT;

-- 확인용 (선택 실행)
-- SELECT name, role, academy_id FROM public.users WHERE email LIKE 'okto091%';
-- SELECT name FROM public.students ORDER BY grade, name;
-- SELECT count(*) FROM public.lesson_logs;
