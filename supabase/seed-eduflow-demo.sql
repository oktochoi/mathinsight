-- =============================================================================
-- EduFlow 공모전 시연용 시드 (seed-eduflow-demo.sql)
-- 학생 20명 · 반 4개
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_admin_id    uuid;
  v_parent_id   uuid;
  v_student_id  uuid;
  v_academy_id  uuid;
  v_class_2a    uuid;
  v_class_2b    uuid;
  v_class_3a    uuid;
  v_class_1h    uuid;
  v_stu_mj      uuid;
  v_stu_sy      uuid;
  v_stu_dy      uuid;
  v_today_dow   int;
  v_today       date := current_date;
  v_d           date;
  v_i           int;
  v_card_mj     uuid;
  v_card_sy     uuid;
  v_card_dy     uuid;
  rec           record;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'okto0914@gmail.com' LIMIT 1;
  SELECT id INTO v_parent_id FROM auth.users WHERE lower(email) = 'okto0915@gmail.com' LIMIT 1;
  SELECT id INTO v_student_id FROM auth.users WHERE lower(email) = 'okto0916@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL OR v_parent_id IS NULL OR v_student_id IS NULL THEN
    RAISE EXCEPTION 'Auth 계정 3개가 필요합니다. scripts/create-demo-auth-users.mjs 또는 /auth 가입 후 다시 실행하세요.';
  END IF;

  v_today_dow := extract(dow from v_today)::int;

  DELETE FROM public.consultation_followups;
  DELETE FROM public.student_connection_requests;
  DELETE FROM public.student_connections;
  DELETE FROM public.schedule_exceptions;
  DELETE FROM public.class_schedules;
  DELETE FROM public.lesson_logs;
  DELETE FROM public.consultation_cards;
  DELETE FROM public.parent_reports;
  DELETE FROM public.students;
  DELETE FROM public.classes;
  DELETE FROM public.academies;
  DELETE FROM public.users WHERE id NOT IN (v_admin_id, v_parent_id, v_student_id);

  INSERT INTO public.users (id, email, name, role, academy_id)
  VALUES
    (v_admin_id, 'okto0914@gmail.com', '김원장', 'admin', NULL),
    (v_parent_id, 'okto0915@gmail.com', '김학부모', 'parent', NULL),
    (v_student_id, 'okto0916@gmail.com', '김민준', 'student', NULL)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;

  v_academy_id := gen_random_uuid();
  INSERT INTO public.academies (id, name, owner_id, connection_code)
  VALUES (v_academy_id, 'EduFlow Demo Academy', v_admin_id, 'EDU-DEMO-01');
  UPDATE public.users SET academy_id = v_academy_id WHERE id = v_admin_id;

  -- 반 4개
  v_class_2a := gen_random_uuid();
  v_class_2b := gen_random_uuid();
  v_class_3a := gen_random_uuid();
  v_class_1h := gen_random_uuid();

  INSERT INTO public.classes (id, academy_id, teacher_id, name, grade) VALUES
    (v_class_2a, v_academy_id, v_admin_id, '중2A반', '중2'),
    (v_class_2b, v_academy_id, v_admin_id, '중2B반', '중2'),
    (v_class_3a, v_academy_id, v_admin_id, '중3A반', '중3'),
    (v_class_1h, v_academy_id, v_admin_id, '고1반', '고1');

  v_stu_mj := gen_random_uuid();
  v_stu_sy := gen_random_uuid();
  v_stu_dy := gen_random_uuid();

  CREATE TEMP TABLE _demo_students (
    id uuid PRIMARY KEY,
    class_id uuid NOT NULL,
    name text NOT NULL,
    school text NOT NULL,
    grade text NOT NULL,
    status text NOT NULL,
    is_spotlight boolean NOT NULL DEFAULT false
  ) ON COMMIT DROP;

  INSERT INTO _demo_students (id, class_id, name, school, grade, status, is_spotlight) VALUES
    (v_stu_mj, v_class_2a, '김민준', 'EduFlow 중학교', '중2', 'consultation', true),
    (v_stu_sy, v_class_2a, '박서연', 'EduFlow 중학교', '중2', 'consultation', true),
    (gen_random_uuid(), v_class_2a, '최하은', 'EduFlow 중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2a, '정우빈', 'EduFlow 중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2a, '한지우', 'EduFlow 중학교', '중2', 'attention', false),
    (gen_random_uuid(), v_class_2a, '오세린', 'EduFlow 중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2b, '강민재', '한빛중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2b, '윤서준', '한빛중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2b, '임도현', '한빛중학교', '중2', 'attention', false),
    (gen_random_uuid(), v_class_2b, '송나윤', '한빛중학교', '중2', 'stable', false),
    (gen_random_uuid(), v_class_2b, '배준혁', '한빛중학교', '중2', 'stable', false),
    (v_stu_dy, v_class_3a, '이도윤', 'EduFlow 중학교', '중3', 'attention', true),
    (gen_random_uuid(), v_class_3a, '정수아', 'EduFlow 중학교', '중3', 'stable', false),
    (gen_random_uuid(), v_class_3a, '황태민', 'EduFlow 중학교', '중3', 'consultation', false),
    (gen_random_uuid(), v_class_3a, '노예린', 'EduFlow 중학교', '중3', 'stable', false),
    (gen_random_uuid(), v_class_3a, '서동현', 'EduFlow 중학교', '중3', 'attention', false),
    (gen_random_uuid(), v_class_1h, '문채원', 'EduFlow 고등학교', '고1', 'stable', false),
    (gen_random_uuid(), v_class_1h, '조현우', 'EduFlow 고등학교', '고1', 'stable', false),
    (gen_random_uuid(), v_class_1h, '홍승기', 'EduFlow 고등학교', '고1', 'attention', false),
    (gen_random_uuid(), v_class_1h, '권다은', 'EduFlow 고등학교', '고1', 'stable', false);

  INSERT INTO public.students (
    id, academy_id, class_id, parent_user_id, student_user_id,
    parent_invite_email, student_invite_email, name, school, grade, status
  )
  SELECT
    d.id, v_academy_id, d.class_id,
    CASE WHEN d.id = v_stu_mj THEN v_parent_id ELSE NULL END,
    CASE WHEN d.id = v_stu_mj THEN v_student_id ELSE NULL END,
    CASE WHEN d.id = v_stu_mj THEN 'okto0915@gmail.com' WHEN d.id = v_stu_sy THEN 'okto0915@gmail.com' ELSE NULL END,
    CASE WHEN d.id = v_stu_mj THEN 'okto0916@gmail.com' ELSE NULL END,
    d.name, d.school, d.grade, d.status::text
  FROM _demo_students d;

  INSERT INTO public.student_connections (student_id, user_id, relationship) VALUES
    (v_stu_mj, v_parent_id, 'guardian'),
    (v_stu_mj, v_student_id, 'student');

  INSERT INTO public.student_connection_requests (
    academy_id, student_id, user_id, relationship,
    requested_student_name, status, reviewed_at, reviewed_by
  ) VALUES
    (v_academy_id, v_stu_mj, v_parent_id, 'guardian', '김민준', 'approved', now(), v_admin_id),
    (v_academy_id, v_stu_mj, v_student_id, 'student', '김민준', 'approved', now() - interval '2 days', v_admin_id);

  -- 시간표: 반별 정기 + 오늘 4건
  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_class_2a, v_admin_id, '중2A 정기수업', 1, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_class_2a, v_admin_id, '중2A 정기수업', 3, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_class_2b, v_admin_id, '중2B 정기수업', 2, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_class_2b, v_admin_id, '중2B 정기수업', 4, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_class_3a, v_admin_id, '중3A 정기수업', 2, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_class_3a, v_admin_id, '중3A 정기수업', 4, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_class_1h, v_admin_id, '고1 정기수업', 6, '10:00', '12:00', 'regular', '301호', true, true);

  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_class_2a, v_admin_id, '중2A 보강', v_today_dow, '15:00', '16:30', 'makeup', '201호', false, true),
    (v_academy_id, v_class_2b, v_admin_id, '중2B 정기', v_today_dow, '17:00', '18:30', 'regular', '202호', false, true),
    (v_academy_id, v_class_3a, v_admin_id, '중3A 정기', v_today_dow, '19:30', '21:00', 'regular', '203호', false, true),
    (v_academy_id, v_class_1h, v_admin_id, '고1 특강', v_today_dow, '10:00', '11:30', 'special', '301호', false, true);

  INSERT INTO public.schedule_exceptions (
    academy_id, class_id, exception_date, exception_type, start_time, end_time, memo, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_class_2a, v_today + 2, 'makeup', '15:00', '16:30', '중2A 보강 — 함수 그래프', true),
    (v_academy_id, v_class_3a, v_today + 4, 'canceled', NULL, NULL, '중3A 정기수업 휴강', true);

  -- 김민준 · 박서연 · 이도윤 (스토리 4주)
  FOR v_i IN 0..3 LOOP
    v_d := v_today - 21 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_class_2a, v_stu_mj, v_admin_id, v_d,
      (ARRAY['함수의 정의','일차함수','함수의 그래프','함수의 그래프'])[v_i+1], 'present',
      (ARRAY['complete','partial','missing','missing'])[v_i+1],
      (ARRAY[78,74,70,68])[v_i+1], ARRAY['함수 오답','계산 실수'],
      (ARRAY['함수 단원 유사 오답 반복.','그래프 해석 실수.','숙제 미제출.','상담 권장.'])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..3 LOOP
    v_d := v_today - 20 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_class_2a, v_stu_sy, v_admin_id, v_d,
      (ARRAY['일차함수','함수의 그래프','연립방정식','함수의 그래프'])[v_i+1], 'present',
      (ARRAY['complete','partial','missing','partial'])[v_i+1],
      (ARRAY[84,78,70,66])[v_i+1], ARRAY['계산 실수','개념 보완'],
      (ARRAY['안정적.','속도 저하.','점수 하락.','보강 필요.'])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..3 LOOP
    v_d := v_today - 19 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_class_3a, v_stu_dy, v_admin_id, v_d,
      (ARRAY['이차함수','이차함수','이차함수','이차함수'])[v_i+1], 'present',
      (ARRAY['missing','partial','complete','complete'])[v_i+1],
      (ARRAY[58,64,72,80])[v_i+1], ARRAY['보강 후 회복'],
      (ARRAY['보강 전.','이해 개선.','회복 중.','회복 유지.'])[v_i+1]);
  END LOOP;

  -- 나머지 17명: 4주 일괄 (반·학년별 단원)
  FOR rec IN
    SELECT d.id, d.class_id, d.grade, d.status, d.name,
           row_number() OVER (ORDER BY d.name) AS rn
    FROM _demo_students d
    WHERE NOT d.is_spotlight
  LOOP
    FOR v_i IN 0..3 LOOP
      v_d := v_today - (21 - v_i * 7 - (rec.rn % 3)::int);
      INSERT INTO public.lesson_logs (
        academy_id, class_id, student_id, teacher_id, lesson_date, unit,
        attendance_status, homework_status, test_score, tags, memo
      ) VALUES (
        v_academy_id, rec.class_id, rec.id, v_admin_id, v_d,
        CASE rec.grade
          WHEN '중2' THEN (ARRAY['일차함수','함수의 그래프','연립방정식','도형'])[v_i+1]
          WHEN '중3' THEN (ARRAY['이차함수','인수분해','확률','원의 성질'])[v_i+1]
          ELSE (ARRAY['다항함수','삼각함수','수열','지수로그'])[v_i+1]
        END,
        CASE WHEN v_i = 0 AND (rec.rn % 7)::int = 0 THEN 'late' ELSE 'present' END,
        CASE
          WHEN rec.status = 'consultation' AND v_i >= 2 THEN 'missing'
          WHEN rec.status = 'attention' AND v_i = 3 THEN 'partial'
          WHEN v_i = 3 AND (rec.rn % 5)::int = 0 THEN 'missing'
          ELSE 'complete'
        END,
        70 + (((rec.rn * 3 + v_i * 5) % 25)::int),
        ARRAY['풀이 과정'],
        rec.name || ' — ' || CASE rec.grade WHEN '고1' THEN '고등 수학' ELSE '중등 수학' END || ' 수업 기록.'
      );
    END LOOP;
  END LOOP;

  -- 오늘 수업 (전원 20명)
  INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
  SELECT v_academy_id, t.class_id, t.id, v_admin_id, v_today, '오늘 수업', 'present',
    CASE
      WHEN t.id = v_stu_mj THEN 'missing'
      WHEN t.id = v_stu_sy THEN 'missing'
      WHEN t.id = v_stu_dy THEN 'missing'
      WHEN t.status = 'consultation' THEN 'partial'
      WHEN t.class_rn % 4 = 0 THEN 'missing'
      ELSE 'complete'
    END,
    CASE WHEN t.id IN (v_stu_mj, v_stu_sy, v_stu_dy) THEN NULL ELSE 75 + (t.global_rn % 20) END,
    ARRAY['오늘 수업'],
    t.name || ' 오늘 수업 기록.'
  FROM (
    SELECT s.*,
      row_number() OVER (PARTITION BY s.class_id ORDER BY s.name) AS class_rn,
      row_number() OVER (ORDER BY s.name) AS global_rn
    FROM public.students s
    WHERE s.academy_id = v_academy_id
  ) t;

  -- 상담 카드 (주요 + 추가 3건)
  v_card_mj := gen_random_uuid();
  v_card_sy := gen_random_uuid();
  v_card_dy := gen_random_uuid();

  INSERT INTO public.consultation_cards (
    id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status, consulted_at, consultation_note
  ) VALUES
    (v_card_mj, v_stu_mj, v_admin_id, v_today - 28, v_today,
     '함수 단원 유사 오답 반복, 숙제 미제출 2회. 상담 권장.',
     '· 최근 함수 그래프 미제출 2회', ARRAY['함수 오답 패턴','숙제 루틴'], '민준 학생 함수 단원 상담 요청드립니다.', now() - interval '2 days',
     'pending', NULL, NULL),
    (v_card_sy, v_stu_sy, v_admin_id, v_today - 21, v_today,
     '점수 84→66 하락. 보강 필요.',
     '· 점수 하락 추세', ARRAY['보강 일정','숙제 점검'], '서연 학생 보강 안내드립니다.', now() - interval '4 days',
     'completed', now() - interval '3 days', '전화 상담 완료'),
    (v_card_dy, v_stu_dy, v_admin_id, v_today - 28, v_today,
     '보강 후 58→80 회복 중.',
     '· 회복 흐름 기록', ARRAY['회복 유지','예습'], '도윤 학생 회복 중입니다.', now() - interval '6 days',
     'completed', now() - interval '5 days', '대면 상담');

  INSERT INTO public.consultation_cards (
    student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status
  )
  SELECT s.id, v_admin_id, v_today - 14, v_today,
    s.name || ' 학생 최근 기록 점검. ' || s.status || ' 상태.',
    '· 수업 기록 4주', ARRAY['학습 습관','단원 점검'],
    s.name || ' 학생 상담 메모입니다.', now() - (row_number() OVER (ORDER BY s.name)) * interval '1 day',
    CASE WHEN row_number() OVER (ORDER BY s.name) = 1 THEN 'pending' ELSE 'completed' END
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND s.status IN ('consultation', 'attention')
    AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy)
  LIMIT 3;

  -- 학부모 리포트 (10건)
  INSERT INTO public.parent_reports (student_id, generated_by, period_start, period_end, tone, report_text, created_at)
  VALUES
    (v_stu_mj, v_admin_id, v_today - 14, v_today, 'friendly',
     E'김민준 학생 리포트 — 함수 단원, 숙제 미제출 2회 기록.', now() - interval '3 days'),
    (v_stu_sy, v_admin_id, v_today - 14, v_today, 'objective',
     E'박서연 학생 리포트 — 점수 하락, 보강 권장.', now() - interval '5 days'),
    (v_stu_dy, v_admin_id, v_today - 14, v_today, 'encouraging',
     E'이도윤 학생 리포트 — 보강 후 회복 중.', now() - interval '7 days');

  INSERT INTO public.parent_reports (student_id, generated_by, period_start, period_end, tone, report_text, created_at)
  SELECT s.id, v_admin_id, v_today - 14, v_today, 'friendly',
    s.name || ' 학생 (' || s.grade || ') 이번 기간 학습 리포트입니다. EduFlow Demo Academy.',
    now() - (row_number() OVER (ORDER BY s.name)) * interval '12 hours'
  FROM public.students s
  WHERE s.academy_id = v_academy_id AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy)
  ORDER BY s.name
  LIMIT 7;

  INSERT INTO public.consultation_followups (academy_id, student_id, consultation_card_id, title, memo, due_date, status)
  VALUES
    (v_academy_id, v_stu_mj, v_card_mj, '함수 오답노트', '유사 오답 3문제', v_today + 3, 'pending'),
    (v_academy_id, v_stu_sy, v_card_sy, '보강 참여', '그래프 보강', v_today + 2, 'pending'),
    (v_academy_id, v_stu_sy, v_card_sy, '숙제 루틴', '미제출 후 습관', v_today + 5, 'pending'),
    (v_academy_id, v_stu_dy, v_card_dy, '회복 유지', '이차함수 예습', v_today + 7, 'pending');

  INSERT INTO public.consultation_followups (academy_id, student_id, title, memo, due_date, status)
  SELECT v_academy_id, s.id, '단원 점검', s.name || ' 상담 후 확인', v_today + 4, 'pending'
  FROM public.students s
  WHERE s.academy_id = v_academy_id AND s.status IN ('consultation', 'attention')
  LIMIT 4;

  RAISE NOTICE 'EduFlow Demo 시드 완료 — 학생 20명, 반 4개. academy_id=%', v_academy_id;
END $$;

COMMIT;
