-- =============================================================================
-- 데모 수학학원 시드 (seed-eduflow-demo.sql)
-- Auth 6계정 · 반 6개 · 학생 50명 · 강사 3명 · 2026-03-01~ 전 기능 ERP 시드
-- 수업·성적·숙제·상담·청구·공지·채팅·구독·신입상담·Agent·RAG
-- 원장 0914 · 강사 0915/0918/0919 · 학부모 0916 · 학생 0917(김민준)
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_admin_id    uuid;
  v_teacher1_id uuid;  -- 이강사 · 중1A·중2A
  v_teacher2_id uuid;  -- 박강사 · 중2B·중3A
  v_teacher3_id uuid;  -- 최강사 · 중3B·고1
  v_parent_id   uuid;
  v_student_user_id uuid;
  v_academy_id  uuid;
  v_c1a uuid; v_c2a uuid; v_c2b uuid; v_c3a uuid; v_c3b uuid; v_c1h uuid;
  v_stu_mj uuid; v_stu_sy uuid; v_stu_dy uuid; v_stu_tm uuid; v_stu_dh uuid;
  v_today_dow int;
  v_today date := current_date;
  v_seed_start date := '2026-03-01';
  v_weeks int;
  v_d date;
  v_i int;
  v_card_mj uuid; v_card_sy uuid; v_card_dy uuid; v_card_tm uuid;
  v_parent_record_id uuid;
  v_staff_admin uuid; v_staff_t1 uuid; v_staff_t2 uuid; v_staff_t3 uuid;
  v_term_id uuid;
  v_sub_id uuid;
  v_chat_mj_parent uuid; v_chat_mj_student uuid;
  v_chat_c2a uuid; v_chat_c3a uuid;
  v_sess_mj uuid; v_sess_sy uuid; v_sess_tm uuid; v_sess_dy uuid;
  v_prospect1 uuid; v_prospect2 uuid; v_prospect3 uuid;
  rec record;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'okto0914@gmail.com' LIMIT 1;
  SELECT id INTO v_teacher1_id FROM auth.users WHERE lower(email) = 'okto0915@gmail.com' LIMIT 1;
  SELECT id INTO v_teacher2_id FROM auth.users WHERE lower(email) = 'okto0918@gmail.com' LIMIT 1;
  SELECT id INTO v_teacher3_id FROM auth.users WHERE lower(email) = 'okto0919@gmail.com' LIMIT 1;
  SELECT id INTO v_parent_id FROM auth.users WHERE lower(email) = 'okto0916@gmail.com' LIMIT 1;
  SELECT id INTO v_student_user_id FROM auth.users WHERE lower(email) = 'okto0917@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL OR v_teacher1_id IS NULL OR v_teacher2_id IS NULL OR v_teacher3_id IS NULL
     OR v_parent_id IS NULL OR v_student_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth 6계정 필요 (0914~0917, 0918, 0919). npm run demo:reset 실행 후 다시 시도하세요.';
  END IF;

  v_weeks := GREATEST(1, LEAST(14, ((v_today - v_seed_start) / 7)::int));

  -- migration 014 미적용 DB 호환 (상담 카드 대기/완료)
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consultation_status text NOT NULL DEFAULT 'pending'
      CHECK (consultation_status IN ('pending', 'completed'));
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consulted_at timestamptz;
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consultation_note text;

  ALTER TABLE public.lesson_logs
    ADD COLUMN IF NOT EXISTS is_makeup boolean NOT NULL DEFAULT false;

  v_today_dow := extract(dow from v_today)::int;

  -- Agent / Vector 테이블 (017+)
  DELETE FROM public.chat_channel_reads;
  DELETE FROM public.chat_messages;
  DELETE FROM public.chat_channels;
  DELETE FROM public.push_tokens;
  DELETE FROM public.intake_consultations;
  DELETE FROM public.reregistration_records;
  DELETE FROM public.counseling_sessions;
  DELETE FROM public.subscription_payments;
  DELETE FROM public.student_risk_snapshots;
  DELETE FROM public.class_progress;
  DELETE FROM public.curriculum_units;
  DELETE FROM public.notification_logs;
  DELETE FROM public.academy_info;
  DELETE FROM public.academy_integrations;
  DELETE FROM public.makeup_lesson_students;
  DELETE FROM public.student_payments;
  DELETE FROM public.homework_submissions;
  DELETE FROM public.homework_assignments;
  DELETE FROM public.exam_scores;
  DELETE FROM public.exams;
  DELETE FROM public.parent_messages;
  DELETE FROM public.announcements;
  DELETE FROM public.academy_subscriptions;
  DELETE FROM public.student_memory_chunks;
  DELETE FROM public.agent_jobs;
  DELETE FROM public.agent_logs;
  DELETE FROM public.student_risk_signals;

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
  DELETE FROM public.class_teachers;
  DELETE FROM public.staff_profiles;
  DELETE FROM public.academy_memberships;
  DELETE FROM public.parent_student_links;
  DELETE FROM public.parents;
  DELETE FROM public.student_enrollments;
  DELETE FROM public.academies;
  DELETE FROM public.users WHERE id NOT IN (
    v_admin_id, v_teacher1_id, v_teacher2_id, v_teacher3_id, v_parent_id, v_student_user_id
  );

  INSERT INTO public.users (id, email, name, role, academy_id)
  VALUES
    (v_admin_id, 'okto0914@gmail.com', '김원장', 'admin', NULL),
    (v_teacher1_id, 'okto0915@gmail.com', '이강사', 'teacher', NULL),
    (v_teacher2_id, 'okto0918@gmail.com', '박강사', 'teacher', NULL),
    (v_teacher3_id, 'okto0919@gmail.com', '최강사', 'teacher', NULL),
    (v_parent_id, 'okto0916@gmail.com', '김학부모', 'parent', NULL),
    (v_student_user_id, 'okto0917@gmail.com', '김민준', 'student', NULL)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;

  v_academy_id := gen_random_uuid();
  INSERT INTO public.academies (id, name, owner_id, connection_code)
  VALUES (v_academy_id, '데모 수학학원', v_admin_id, 'DEMO-MATH-26');
  UPDATE public.users SET academy_id = v_academy_id
  WHERE id IN (v_admin_id, v_teacher1_id, v_teacher2_id, v_teacher3_id);

  INSERT INTO public.academy_memberships (user_id, academy_id, role, status)
  VALUES
    (v_admin_id, v_academy_id, 'owner', 'active'),
    (v_teacher1_id, v_academy_id, 'teacher', 'active'),
    (v_teacher2_id, v_academy_id, 'teacher', 'active'),
    (v_teacher3_id, v_academy_id, 'teacher', 'active')
  ON CONFLICT (user_id, academy_id, role) DO UPDATE SET status = 'active';

  INSERT INTO public.staff_profiles (user_id, academy_id, hire_date)
  VALUES
    (v_admin_id, v_academy_id, v_seed_start),
    (v_teacher1_id, v_academy_id, v_seed_start),
    (v_teacher2_id, v_academy_id, v_seed_start),
    (v_teacher3_id, v_academy_id, v_seed_start)
  ON CONFLICT (user_id) DO UPDATE SET academy_id = EXCLUDED.academy_id;

  v_c1a := gen_random_uuid();
  v_c2a := gen_random_uuid();
  v_c2b := gen_random_uuid();
  v_c3a := gen_random_uuid();
  v_c3b := gen_random_uuid();
  v_c1h := gen_random_uuid();

  INSERT INTO public.classes (id, academy_id, teacher_id, name, grade) VALUES
    (v_c1a, v_academy_id, v_teacher1_id, '중1A반 (기초)', '중1'),
    (v_c2a, v_academy_id, v_teacher1_id, '중2A반 (내신)', '중2'),
    (v_c2b, v_academy_id, v_teacher2_id, '중2B반 (심화)', '중2'),
    (v_c3a, v_academy_id, v_teacher2_id, '중3A반 (내신)', '중3'),
    (v_c3b, v_academy_id, v_teacher3_id, '중3B반 (심화)', '중3'),
    (v_c1h, v_academy_id, v_teacher3_id, '고1반 (공통수학1)', '고1');

  INSERT INTO public.class_teachers (class_id, staff_id, role, start_date)
  SELECT c.id, sp.id, 'homeroom', v_seed_start
  FROM public.classes c
  JOIN public.staff_profiles sp ON sp.academy_id = v_academy_id
    AND sp.user_id = CASE
      WHEN c.id IN (v_c1a, v_c2a) THEN v_teacher1_id
      WHEN c.id IN (v_c2b, v_c3a) THEN v_teacher2_id
      ELSE v_teacher3_id
    END
  ON CONFLICT DO NOTHING;

  v_stu_mj := gen_random_uuid();
  v_stu_sy := gen_random_uuid();
  v_stu_dy := gen_random_uuid();
  v_stu_tm := gen_random_uuid();
  v_stu_dh := gen_random_uuid();

  CREATE TEMP TABLE _demo_students (
    id uuid PRIMARY KEY,
    class_id uuid NOT NULL,
    name text NOT NULL,
    school text NOT NULL,
    grade text NOT NULL,
    status text NOT NULL,
    is_spotlight boolean NOT NULL DEFAULT false,
    story_key text
  ) ON COMMIT DROP;

  INSERT INTO _demo_students (id, class_id, name, school, grade, status, is_spotlight, story_key) VALUES
    -- 중1A
    (gen_random_uuid(), v_c1a, '신예준', '역삼중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '유하린', '역삼중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '장민성', '대치중학교', '중1', 'attention', false, null),
    (gen_random_uuid(), v_c1a, '고은우', '대치중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '설지원', '강남중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '남도겸', '강남중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '김서아', '역삼중학교', '중1', 'stable', false, null),
    (gen_random_uuid(), v_c1a, '이준호', '대치중학교', '중1', 'attention', false, null),
    -- 중2A
    (v_stu_mj, v_c2a, '김민준', '대치중학교', '중2', 'consultation', true, 'mj'),
    (v_stu_sy, v_c2a, '박서연', '대치중학교', '중2', 'consultation', true, 'sy'),
    (gen_random_uuid(), v_c2a, '최하은', '대치중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '정우빈', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '한지우', '역삼중학교', '중2', 'attention', false, null),
    (gen_random_uuid(), v_c2a, '오세린', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '윤채아', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '류건호', '대치중학교', '중2', 'attention', false, null),
    (gen_random_uuid(), v_c2a, '송지민', '역삼중학교', '중2', 'stable', false, null),
    -- 중2B
    (gen_random_uuid(), v_c2b, '강민재', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '윤서준', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '임도현', '강남중학교', '중2', 'attention', false, null),
    (gen_random_uuid(), v_c2b, '송나윤', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '배준혁', '대치중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '표시율', '대치중학교', '중2', 'consultation', false, null),
    (gen_random_uuid(), v_c2b, '차은별', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '안유진', '강남중학교', '중2', 'stable', false, null),
    -- 중3A
    (v_stu_dy, v_c3a, '이도윤', '대치중학교', '중3', 'attention', true, 'dy'),
    (gen_random_uuid(), v_c3a, '정수아', '대치중학교', '중3', 'stable', false, null),
    (v_stu_tm, v_c3a, '황태민', '역삼중학교', '중3', 'consultation', true, 'tm'),
    (gen_random_uuid(), v_c3a, '노예린', '강남중학교', '중3', 'stable', false, null),
    (v_stu_dh, v_c3a, '서동현', '강남중학교', '중3', 'consultation', true, 'dh'),
    (gen_random_uuid(), v_c3a, '진아름', '대치중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3a, '피승민', '역삼중학교', '중3', 'attention', false, null),
    (gen_random_uuid(), v_c3a, '곽하율', '강남중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3a, '한승민', '대치중학교', '중3', 'attention', false, null),
    (gen_random_uuid(), v_c3a, '조예린', '역삼중학교', '중3', 'stable', false, null),
    -- 중3B
    (gen_random_uuid(), v_c3b, '나현준', '대치중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3b, '도승우', '역삼중학교', '중3', 'consultation', false, null),
    (gen_random_uuid(), v_c3b, '라유진', '강남중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3b, '마정호', '대치중학교', '중3', 'attention', false, null),
    (gen_random_uuid(), v_c3b, '반소율', '역삼중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3b, '서지안', '대치중학교', '중3', 'consultation', false, null),
    (gen_random_uuid(), v_c3b, '구민석', '강남중학교', '중3', 'stable', false, null),
    -- 고1
    (gen_random_uuid(), v_c1h, '문채원', '강남고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '조현우', '강남고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '홍승기', '대치고등학교', '고1', 'attention', false, null),
    (gen_random_uuid(), v_c1h, '권다은', '대치고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '금서윤', '역삼고등학교', '고1', 'consultation', false, null),
    (gen_random_uuid(), v_c1h, '탁지훈', '역삼고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '양하늘', '강남고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '신우진', '대치고등학교', '고1', 'attention', false, null);

  INSERT INTO public.students (
    id, academy_id, class_id, name, school, grade, status
  )
  SELECT
    d.id, v_academy_id, d.class_id,
    d.name, d.school, d.grade, d.status::text
  FROM _demo_students d;

  INSERT INTO public.student_connections (student_id, user_id, relationship) VALUES
    (v_stu_mj, v_parent_id, 'guardian'),
    (v_stu_mj, v_student_user_id, 'student');

  INSERT INTO public.student_connection_requests (
    academy_id, student_id, user_id, relationship,
    requested_student_name, status, reviewed_at, reviewed_by
  ) VALUES
    (v_academy_id, v_stu_mj, v_parent_id, 'guardian', '김민준', 'approved', now(), v_admin_id),
    (v_academy_id, v_stu_mj, v_student_user_id, 'student', '김민준', 'approved', now() - interval '2 days', v_admin_id);

  -- 시간표 (정기 + 오늘)
  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c1a, v_teacher1_id, '중1A 정기 (월·수)', 1, '17:30', '19:00', 'regular', '101호', true, true),
    (v_academy_id, v_c1a, v_teacher1_id, '중1A 정기 (월·수)', 3, '17:30', '19:00', 'regular', '101호', true, true),
    (v_academy_id, v_c2a, v_teacher1_id, '중2A 정기 (월·수)', 1, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_c2a, v_teacher1_id, '중2A 정기 (월·수)', 3, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_c2b, v_teacher2_id, '중2B 정기 (화·목)', 2, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_c2b, v_teacher2_id, '중2B 정기 (화·목)', 4, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_c3a, v_teacher2_id, '중3A 정기 (화·목)', 2, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_c3a, v_teacher2_id, '중3A 정기 (화·목)', 4, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_c3b, v_teacher3_id, '중3B 정기 (금)', 5, '19:30', '21:00', 'regular', '204호', true, true),
    (v_academy_id, v_c1h, v_teacher3_id, '고1 정기 (토)', 6, '10:00', '12:00', 'regular', '301호', true, true);

  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c2a, v_teacher1_id, '중2A 함수 보강', v_today_dow, '15:00', '16:30', 'makeup', '201호', false, true),
    (v_academy_id, v_c2b, v_teacher2_id, '중2B 정기', v_today_dow, '17:00', '18:30', 'regular', '202호', false, true),
    (v_academy_id, v_c3a, v_teacher2_id, '중3A 인수분해', v_today_dow, '19:30', '21:00', 'regular', '203호', false, true),
    (v_academy_id, v_c3b, v_teacher3_id, '중3B 모의', v_today_dow, '19:30', '21:00', 'regular', '204호', false, true),
    (v_academy_id, v_c1h, v_teacher3_id, '고1 공통수학1', v_today_dow, '10:00', '11:30', 'regular', '301호', false, true);

  INSERT INTO public.schedule_exceptions (
    academy_id, class_id, exception_date, exception_type, start_time, end_time, memo, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c2a, v_today + 2, 'makeup', '15:00', '16:30', '중2A 보강 — 함수 그래프·좌표평면', true),
    (v_academy_id, v_c3a, v_today + 4, 'canceled', NULL, NULL, '중3A 정기수업 휴강 (학교 행사)', true),
    (v_academy_id, v_c1h, v_today + 7, 'special', '14:00', '16:00', '고1 기말 대비 특강', true);

  -- ── 스토리 학생: 3월부터 주 1회 수업기록 ──
  FOR v_i IN 0..v_weeks LOOP
    v_d := v_seed_start + (v_i * 7);
    IF v_d >= v_today THEN CONTINUE; END IF;
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c2a, v_stu_mj, v_teacher1_id, v_d,
      (ARRAY['함수의 정의','일차함수','함수의 그래프','함수의 그래프','연립방정식','함수의 그래프','연립방정식','도형의 성질','함수 종합','함수의 그래프','연립방정식','함수 종합','내신 대비'])[1 + (v_i % 6)],
      CASE WHEN v_i % 9 = 8 THEN 'late' ELSE 'present' END,
      (ARRAY['complete','partial','missing','missing','partial','missing','complete','partial','missing','partial','complete','missing','partial'])[1 + (v_i % 6)],
      GREATEST(62, 82 - (v_i * 2) + (v_i % 3)),
      ARRAY['함수 오답','그래프 해석','숙제 루틴'],
      format('[%s주차] 김민준 — 이강사 기록 · 함수·그래프 단원.', v_i + 1));
  END LOOP;

  FOR v_i IN 0..v_weeks LOOP
    v_d := v_seed_start + 1 + (v_i * 7);
    IF v_d >= v_today THEN CONTINUE; END IF;
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c2a, v_stu_sy, v_teacher1_id, v_d,
      (ARRAY['일차함수','함수의 그래프','연립방정식','함수의 그래프','도형의 성질','함수 종합'])[1 + (v_i % 6)],
      CASE WHEN v_i = 4 THEN 'late' ELSE 'present' END,
      (ARRAY['complete','complete','partial','missing','partial','missing'])[1 + (v_i % 6)],
      GREATEST(58, 88 - (v_i * 3)),
      ARRAY['계산 실수','개념 보완','속도 저하'],
      format('[%s주차] 박서연 — 중2A 내신 진행.', v_i + 1));
  END LOOP;

  FOR v_i IN 0..v_weeks LOOP
    v_d := v_seed_start + 2 + (v_i * 7);
    IF v_d >= v_today THEN CONTINUE; END IF;
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_dy, v_teacher2_id, v_d,
      (ARRAY['이차함수','이차함수','인수분해','이차함수','확률','이차함수'])[1 + (v_i % 6)],
      'present',
      (ARRAY['missing','partial','partial','complete','complete','complete'])[1 + (v_i % 6)],
      LEAST(90, 52 + (v_i * 3)),
      ARRAY['보강 후 회복','인수분해','자신감 회복'],
      format('[%s주차] 이도윤 — 보강 후 회복세.', v_i + 1));
  END LOOP;

  FOR v_i IN 0..v_weeks LOOP
    v_d := v_seed_start + 3 + (v_i * 7);
    IF v_d >= v_today THEN CONTINUE; END IF;
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_tm, v_teacher2_id, v_d,
      (ARRAY['인수분해','인수분해','인수분해','원의 성질','인수분해','확률'])[1 + (v_i % 6)],
      'present',
      (ARRAY['partial','missing','missing','partial','missing','partial'])[1 + (v_i % 6)],
      GREATEST(58, 70 - v_i),
      ARRAY['인수분해 정체','숙제 미제출','상담 권장'],
      format('[%s주차] 황태민 — 인수분해 단원 집중.', v_i + 1));
  END LOOP;

  FOR v_i IN 0..v_weeks LOOP
    v_d := v_seed_start + 4 + (v_i * 7);
    IF v_d >= v_today THEN CONTINUE; END IF;
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_dh, v_teacher2_id, v_d,
      (ARRAY['확률','원의 성질','원의 성질','이차함수','확률','기하 종합'])[1 + (v_i % 6)],
      CASE WHEN v_i = 2 THEN 'absent' ELSE 'present' END,
      (ARRAY['complete','partial','missing','partial','missing','partial'])[1 + (v_i % 6)],
      GREATEST(55, 76 - (v_i * 2)),
      ARRAY['결석','보강 필요','기하 응용'],
      format('[%s주차] 서동현 — 중3A 내신.', v_i + 1));
  END LOOP;

  -- 나머지 학생: 3월부터 주 1회
  FOR rec IN
    SELECT d.id, d.class_id, d.grade, d.status, d.name, d.school,
           row_number() OVER (ORDER BY d.name) AS rn
    FROM _demo_students d
    WHERE NOT d.is_spotlight
  LOOP
    FOR v_i IN 0..v_weeks LOOP
      v_d := v_seed_start + ((v_i * 7) + (rec.rn % 4)::int);
      IF v_d >= v_today THEN CONTINUE; END IF;
      INSERT INTO public.lesson_logs (
        academy_id, class_id, student_id, teacher_id, lesson_date, unit,
        attendance_status, homework_status, test_score, tags, memo
      ) VALUES (
        v_academy_id, rec.class_id, rec.id,
        CASE
          WHEN rec.class_id IN (v_c1a, v_c2a) THEN v_teacher1_id
          WHEN rec.class_id IN (v_c2b, v_c3a) THEN v_teacher2_id
          ELSE v_teacher3_id
        END,
        v_d,
        coalesce(
          CASE rec.grade
            WHEN '중1' THEN (ARRAY['정수와 유리수','문자와 식','일차방정식','좌표평면','기본 도형'])[1 + (v_i % 5)]
            WHEN '중2' THEN (ARRAY['유리수 연산','일차함수','함수의 그래프','연립방정식','도형의 성질'])[1 + (v_i % 5)]
            WHEN '중3' THEN (ARRAY['제곱근','인수분해','이차함수','원의 성질','확률'])[1 + (v_i % 5)]
            ELSE (ARRAY['다항식','방정식과 부등식','도형의 방정식','집합','함수'])[1 + (v_i % 5)]
          END,
          '종합 복습'
        ),
        CASE WHEN v_i = 1 AND (rec.rn % 11)::int = 0 THEN 'late' WHEN v_i = 2 AND (rec.rn % 13)::int = 0 THEN 'absent' ELSE 'present' END,
        CASE
          WHEN rec.status = 'consultation' AND v_i >= 3 THEN 'missing'
          WHEN rec.status = 'attention' AND v_i >= 2 THEN 'partial'
          WHEN v_i = 4 AND (rec.rn % 6)::int = 0 THEN 'missing'
          WHEN v_i = 3 AND (rec.rn % 8)::int = 0 THEN 'partial'
          ELSE 'complete'
        END,
        LEAST(98, GREATEST(55, 68 + (((rec.rn * 7 + v_i * 11) % 28)::int) - CASE rec.status WHEN 'consultation' THEN 8 WHEN 'attention' THEN 4 ELSE 0 END)),
        CASE rec.grade
          WHEN '고1' THEN ARRAY['공통수학1','풀이 과정']
          WHEN '중1' THEN ARRAY['연산','개념']
          ELSE ARRAY['내신','풀이 속도']
        END,
        format(
          '[%s] %s · %s · %s주차(3월~) — %s 단원. 담당: %s. %s',
          rec.grade, rec.name, rec.school,
          (v_i + 1)::text,
          CASE rec.grade WHEN '중1' THEN '중1 기초' WHEN '중2' THEN '중2 내신' WHEN '중3' THEN '중3 내신' ELSE '고1 공통' END,
          CASE WHEN rec.class_id IN (v_c1a, v_c2a) THEN '이강사'
               WHEN rec.class_id IN (v_c2b, v_c3a) THEN '박강사'
               ELSE '최강사' END,
          CASE
            WHEN rec.status = 'consultation' THEN '최근 숙제·점수 추이 모니터링 중(상담 대상).'
            WHEN rec.status = 'attention' THEN '가벼운 주의 구간. 오답노트 제출 권장.'
            ELSE '학습 루틴 안정. 다음 주 단원 예습 안내 완료.'
          END
        )
      );
    END LOOP;
  END LOOP;

  -- 오늘 수업 (전원)
  INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
  SELECT v_academy_id, t.class_id, t.id,
    CASE
      WHEN t.class_id IN (v_c1a, v_c2a) THEN v_teacher1_id
      WHEN t.class_id IN (v_c2b, v_c3a) THEN v_teacher2_id
      ELSE v_teacher3_id
    END,
    v_today,
    CASE t.grade
      WHEN '중1' THEN '정수·유리수 복습'
      WHEN '중2' THEN '함수의 그래프 (오늘)'
      WHEN '중3' THEN '인수분해·이차함수'
      ELSE '다항식·방정식'
    END,
    CASE WHEN t.id = v_stu_dh AND extract(dow from v_today)::int = 3 THEN 'present' ELSE 'present' END,
    CASE
      WHEN t.id = v_stu_mj THEN 'missing'
      WHEN t.id = v_stu_sy THEN 'missing'
      WHEN t.id = v_stu_tm THEN 'missing'
      WHEN t.id IN (v_stu_dy, v_stu_dh) THEN 'partial'
      WHEN t.status = 'consultation' THEN 'partial'
      WHEN t.class_rn % 5 = 0 THEN 'missing'
      ELSE 'complete'
    END,
    CASE
      WHEN t.id IN (v_stu_mj, v_stu_sy, v_stu_tm) THEN NULL
      WHEN t.is_spotlight THEN 70 + (t.global_rn % 15)
      ELSE 72 + (t.global_rn % 22)
    END,
    ARRAY['오늘 수업','내신 대비'],
    format('[%s] %s — 오늘 수업(%s). 출결·숙제는 학부모 포털에 동기화됩니다.', t.grade, t.name, to_char(v_today, 'YYYY-MM-DD'))
  FROM (
    SELECT s.*, d.is_spotlight,
      row_number() OVER (PARTITION BY s.class_id ORDER BY s.name) AS class_rn,
      row_number() OVER (ORDER BY s.name) AS global_rn
    FROM public.students s
    JOIN _demo_students d ON d.id = s.id
    WHERE s.academy_id = v_academy_id
  ) t;

  -- ── 등록일·수강 시작일 (3월 개학 스토리) ──
  UPDATE public.students
  SET registered_at = v_seed_start
  WHERE academy_id = v_academy_id AND enrollment_status = 'active';

  UPDATE public.student_enrollments
  SET start_date = v_seed_start
  WHERE academy_id = v_academy_id;

  SELECT id INTO v_staff_admin FROM public.staff_profiles WHERE user_id = v_admin_id AND academy_id = v_academy_id;
  SELECT id INTO v_staff_t1 FROM public.staff_profiles WHERE user_id = v_teacher1_id AND academy_id = v_academy_id;
  SELECT id INTO v_staff_t2 FROM public.staff_profiles WHERE user_id = v_teacher2_id AND academy_id = v_academy_id;
  SELECT id INTO v_staff_t3 FROM public.staff_profiles WHERE user_id = v_teacher3_id AND academy_id = v_academy_id;
  SELECT id INTO v_term_id FROM public.academic_terms WHERE academy_id = v_academy_id AND is_current = true LIMIT 1;

  SELECT p.id INTO v_parent_record_id
  FROM public.parents p
  WHERE p.academy_id = v_academy_id AND p.user_id = v_parent_id
  LIMIT 1;

  IF v_parent_record_id IS NULL THEN
    INSERT INTO public.parents (academy_id, user_id, name, email)
    VALUES (v_academy_id, v_parent_id, '김학부모', 'okto0916@gmail.com')
    RETURNING id INTO v_parent_record_id;
    INSERT INTO public.parent_student_links (parent_id, student_id, relationship, is_primary)
    VALUES (v_parent_record_id, v_stu_mj, 'guardian', true)
    ON CONFLICT (parent_id, student_id) DO NOTHING;
  END IF;

  -- ── 커리큘럼 · 반별 진도 ──
  INSERT INTO public.curriculum_units (academy_id, subject, grade, unit_name, sort_order) VALUES
    (v_academy_id, '수학', '중1', '정수와 유리수', 1),
    (v_academy_id, '수학', '중1', '문자와 식', 2),
    (v_academy_id, '수학', '중1', '일차방정식', 3),
    (v_academy_id, '수학', '중1', '좌표평면과 그래프', 4),
    (v_academy_id, '수학', '중2', '유리수와 순환소수', 1),
    (v_academy_id, '수학', '중2', '일차함수', 2),
    (v_academy_id, '수학', '중2', '함수의 그래프', 3),
    (v_academy_id, '수학', '중2', '연립방정식', 4),
    (v_academy_id, '수학', '중3', '제곱근과 실수', 1),
    (v_academy_id, '수학', '중3', '인수분해', 2),
    (v_academy_id, '수학', '중3', '이차함수', 3),
    (v_academy_id, '수학', '중3', '원의 성질', 4),
    (v_academy_id, '수학', '고1', '다항식', 1),
    (v_academy_id, '수학', '고1', '방정식과 부등식', 2),
    (v_academy_id, '수학', '고1', '도형의 방정식', 3);

  INSERT INTO public.class_progress (academy_id, class_id, unit_name, notes, updated_at) VALUES
    (v_academy_id, v_c1a, '일차방정식', '3월 개학 후 기초 다지기 완료', (v_seed_start + 21)::timestamptz),
    (v_academy_id, v_c2a, '함수의 그래프', '김민준·박서연 집중 관리 구간', (v_today - 3)::timestamptz),
    (v_academy_id, v_c2b, '연립방정식', '심화반 — 조건 해석 보강 중', (v_today - 5)::timestamptz),
    (v_academy_id, v_c3a, '인수분해', '황태민 단원 정체 · 보강 특강 예정', (v_today - 2)::timestamptz),
    (v_academy_id, v_c3b, '이차함수', '중3B 심화 — 기하 연계', (v_today - 7)::timestamptz),
    (v_academy_id, v_c1h, '방정식과 부등식', '고1 공통수학1 진행', (v_today - 4)::timestamptz);

  -- ── 단원평가 · 성적 (3월·4월, 반별 2회) ──
  INSERT INTO public.exams (academy_id, class_id, name, exam_date, unit_scope, created_by)
  SELECT v_academy_id, c.id,
    CASE gs.n WHEN 1 THEN '1차 단원평가 (3월)' ELSE '2차 단원평가 (4월)' END,
    CASE gs.n WHEN 1 THEN '2026-03-18'::date ELSE '2026-04-22'::date END,
    CASE c.grade
      WHEN '중1' THEN CASE gs.n WHEN 1 THEN '정수·유리수' ELSE '일차방정식' END
      WHEN '중2' THEN CASE gs.n WHEN 1 THEN '일차함수' ELSE '함수의 그래프' END
      WHEN '중3' THEN CASE gs.n WHEN 1 THEN '인수분해' ELSE '이차함수' END
      ELSE CASE gs.n WHEN 1 THEN '다항식' ELSE '방정식' END
    END,
    CASE c.id
      WHEN v_c1a THEN v_teacher1_id WHEN v_c2a THEN v_teacher1_id
      WHEN v_c2b THEN v_teacher2_id WHEN v_c3a THEN v_teacher2_id
      ELSE v_teacher3_id
    END
  FROM public.classes c
  CROSS JOIN generate_series(1, 2) AS gs(n)
  WHERE c.academy_id = v_academy_id;

  INSERT INTO public.exam_scores (exam_id, student_id, score, feedback_memo)
  SELECT e.id, s.id,
    CASE
      WHEN s.id = v_stu_mj AND e.exam_date = '2026-03-18' THEN 78
      WHEN s.id = v_stu_mj THEN 65
      WHEN s.id = v_stu_sy AND e.exam_date = '2026-03-18' THEN 88
      WHEN s.id = v_stu_sy THEN 62
      WHEN s.id = v_stu_dy AND e.exam_date = '2026-03-18' THEN 52
      WHEN s.id = v_stu_dy THEN 82
      WHEN s.id = v_stu_tm AND e.exam_date = '2026-03-18' THEN 70
      WHEN s.id = v_stu_tm THEN 61
      ELSE LEAST(98, GREATEST(55, 68 + ((abs(hashtext(s.id::text || e.id::text)) % 25) - 5)))
    END,
    CASE
      WHEN s.id IN (v_stu_mj, v_stu_sy, v_stu_tm) THEN '내신 대비 취약 유형 오답노트 권장'
      ELSE NULL
    END
  FROM public.exams e
  JOIN public.students s ON s.class_id = e.class_id
  WHERE e.academy_id = v_academy_id;

  -- ── 숙제 (3월~ 주 1회 · 반별) ──
  INSERT INTO public.homework_assignments (academy_id, class_id, title, description, due_date, lesson_date, unit, created_by)
  SELECT v_academy_id, c.id,
    format('%s — %s주차 숙제', c.name, (w.w + 1)::text),
    format('3월 개학 %s주차 연습문제 (내신 대비)', (w.w + 1)::text),
    v_seed_start + ((w.w * 7) + 2)::int,
    v_seed_start + (w.w * 7)::int,
    CASE c.grade
      WHEN '중1' THEN (ARRAY['정수 연산','문자와 식','일차방정식','좌표평면','기본 도형'])[1 + (w.w % 5)]
      WHEN '중2' THEN (ARRAY['유리수','일차함수','함수 그래프','연립방정식','도형'])[1 + (w.w % 5)]
      WHEN '중3' THEN (ARRAY['제곱근','인수분해','이차함수','원','확률'])[1 + (w.w % 5)]
      ELSE (ARRAY['다항식','방정식','도형의 방정식','집합','함수'])[1 + (w.w % 5)]
    END,
    CASE c.id
      WHEN v_c1a THEN v_teacher1_id WHEN v_c2a THEN v_teacher1_id
      WHEN v_c2b THEN v_teacher2_id WHEN v_c3a THEN v_teacher2_id
      ELSE v_teacher3_id
    END
  FROM public.classes c
  CROSS JOIN generate_series(0, LEAST(v_weeks, 10)) AS w(w)
  WHERE c.academy_id = v_academy_id
    AND v_seed_start + ((w.w * 7) + 2)::int <= v_today;

  INSERT INTO public.homework_submissions (assignment_id, student_id, status, feedback_memo)
  SELECT ha.id, s.id,
    CASE
      WHEN s.id = v_stu_mj AND ha.due_date >= v_today - 14 THEN 'missing'
      WHEN s.id = v_stu_sy AND ha.due_date >= v_today - 21 THEN 'partial'
      WHEN s.id = v_stu_tm AND ha.unit LIKE '%인수분해%' THEN 'missing'
      WHEN s.status = 'consultation' AND ha.due_date >= v_today - 28 THEN
        CASE WHEN abs(hashtext(s.id::text || ha.id::text)) % 3 = 0 THEN 'missing' ELSE 'partial' END
      WHEN s.status = 'attention' AND abs(hashtext(s.id::text || ha.id::text)) % 4 = 0 THEN 'partial'
      WHEN abs(hashtext(s.id::text || ha.id::text)) % 11 = 0 THEN 'missing'
      WHEN abs(hashtext(s.id::text || ha.id::text)) % 7 = 0 THEN 'partial'
      ELSE 'complete'
    END,
    CASE WHEN s.id = v_stu_mj THEN '함수 그래프 유형 — 학부모 확인 요청' ELSE NULL END
  FROM public.homework_assignments ha
  JOIN public.students s ON s.class_id = ha.class_id
  WHERE ha.academy_id = v_academy_id;

  UPDATE public.lesson_logs SET is_makeup = true
  WHERE student_id IN (v_stu_sy, v_stu_mj)
    AND lesson_date BETWEEN v_today - 21 AND v_today - 14;

  -- 상담 카드 (스토리 + 추가)
  v_card_mj := gen_random_uuid();
  v_card_sy := gen_random_uuid();
  v_card_dy := gen_random_uuid();
  v_card_tm := gen_random_uuid();

  INSERT INTO public.consultation_cards (
    id, academy_id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status, consulted_at, consultation_note
  ) VALUES
    (v_card_mj, v_academy_id, v_stu_mj, v_admin_id, v_seed_start, v_today,
     '3월부터 꾸준히 수강 중. 함수·그래프 단원에서 유사 오답이 반복됩니다. 최근 숙제 미제출로 학습 루틴 점검이 필요합니다.',
     E'· 3월~현재 주 1회 수업 기록\n· 숙제 미제출 누적\n· 함수 그래프 오답 반복',
     ARRAY['함수 그래프 보강 일정','숙제 체크리스트(학부모 협조)','오답노트 3유형'],
     E'안녕하세요, 김민준 학부모님.\n데모 수학학원입니다. 3월부터 꾸준히 다니고 있으나 함수 단원 숙제·오답 관리 상담을 요청드립니다.\n— 김원장',
     now() - interval '1 day', 'pending', NULL, NULL),
    (v_card_sy, v_academy_id, v_stu_sy, v_admin_id, v_today - 28, v_today,
     '박서연 학생은 88점대에서 62점까지 하락했습니다. 연립방정식·함수 종합에서 조건 해석과 속도 이슈가 있습니다.',
     E'· 점수: 88→62\n· 지각 1회, 숙제 미제출 2회\n· 보강반(중2B) 또는 1:1 검토',
     ARRAY['보강반 편성','숙제 제출 루틴','내신 범위 공유'],
     '서연 학생 보강 일정 안내드립니다. 수요일 보강 가능 여부 알려주세요.',
     now() - interval '4 days', 'completed', now() - interval '3 days', '전화 상담 — 보강반 수요일 확정'),
    (v_card_dy, v_academy_id, v_stu_dy, v_admin_id, v_today - 35, v_today,
     '이도윤 학생은 보강 후 52→82로 회복 중입니다. 인수분해·이차함수 숙제 제출률이 개선되었습니다.',
     E'· 보강 2회 후 점수 상승\n· 숙제: missing→complete\n· 다음: 내신 예습',
     ARRAY['회복세 유지','가정 학습 시간','내신 일정'],
     '도윤 학생 회복 흐름 공유드립니다. 다음 주 예습 범위 문자 드리겠습니다.',
     now() - interval '6 days', 'completed', now() - interval '5 days', '대면 상담 완료'),
    (v_card_tm, v_academy_id, v_stu_tm, v_admin_id, v_today - 21, v_today,
     '황태민 학생 인수분해 단원 4주 정체. 숙제 미제출 누적으로 상담 권장합니다.',
     E'· 동일 단원 4주\n· 평가 70→61\n· Agent 상담 초안 생성됨',
     ARRAY['인수분해 특강','숙제 관리','학교 시험 일정'],
     '태민 학생 인수분해 보강 상담 요청드립니다.',
     now() - interval '2 days', 'pending', NULL, NULL);

  INSERT INTO public.consultation_cards (
    academy_id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status, consulted_at, consultation_note
  )
  SELECT v_academy_id, s.id, v_admin_id, v_today - 14, v_today,
    s.name || ' 학생(' || s.grade || ') — 최근 5주 수업·숙제·점수를 종합한 상담 카드입니다. 상태: ' || s.status || '.',
    E'· 수업 기록 5주\n· Risk Agent 분류 반영\n· 후속: 오답노트·보강',
    ARRAY['학습 습관 점검','단원별 취약 유형','학부모 협조 사항'],
    s.name || ' 학부모님, 데모 수학학원입니다. 최근 학습 흐름 공유드리며 상담 일정 조율 부탁드립니다.',
    now() - (row_number() OVER (ORDER BY s.name)) * interval '18 hours',
    CASE WHEN row_number() OVER (ORDER BY s.name) <= 2 THEN 'pending' ELSE 'completed' END,
    CASE WHEN row_number() OVER (ORDER BY s.name) > 2 THEN now() - interval '1 day' ELSE NULL END,
    CASE WHEN row_number() OVER (ORDER BY s.name) > 2 THEN '상담 완료 처리' ELSE NULL END
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND s.status IN ('consultation', 'attention')
    AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy, v_stu_tm)
  LIMIT 8;

  -- 학부모 리포트 (전문 문구)
  INSERT INTO public.parent_reports (academy_id, student_id, generated_by, period_start, period_end, tone, report_text, published_to_portal_at, created_at)
  VALUES
    (v_academy_id, v_stu_mj, v_admin_id, v_today - 14, v_today, 'objective',
     E'[주간 학습 리포트 — 김민준 / 중2A]\n\n안녕하세요, 학부모님. 데모 수학학원입니다.\n\n3월부터 꾸준히 수업에 참여하고 있으며, 함수·그래프 단원을 진행 중입니다. 숙제 루틴 점검이 필요합니다.\n\n— 이강사 (중2A 담당)',
     now() - interval '2 days', now() - interval '2 days'),
    (v_academy_id, v_stu_sy, v_admin_id, v_today - 14, v_today, 'objective',
     E'[주간 리포트 — 박서연]\n\n점수 추이 88→62로 하락하여 보강반 편성을 권장드립니다. 연립방정식 조건 해석 보충 예정입니다.',
     now() - interval '4 days', now() - interval '4 days'),
    (v_academy_id, v_stu_dy, v_admin_id, v_today - 14, v_today, 'encouraging',
     E'[주간 리포트 — 이도윤]\n\n보강 후 회복세가 뚜렷합니다(52→82). 숙제 제출률 개선, 다음 주 내신 예습을 함께 진행하겠습니다.',
     now() - interval '5 days', now() - interval '5 days'),
    (v_academy_id, v_stu_tm, v_admin_id, v_today - 7, v_today, 'friendly',
     E'[주간 리포트 — 황태민]\n\n인수분해 단원에서 학습 정체가 관찰됩니다. 보강 특강 안내 예정이며 상담 일정 회신 부탁드립니다.\n\n[Agent 초안 — 원장 확인 후 발송]',
     NULL, now() - interval '1 day');

  INSERT INTO public.parent_reports (academy_id, student_id, generated_by, period_start, period_end, tone, report_text, published_to_portal_at, created_at)
  SELECT v_academy_id, s.id, v_admin_id, v_today - 14, v_today,
    (ARRAY['friendly','objective','encouraging'])[1 + (row_number() OVER (ORDER BY s.name) % 3)],
    format(
      E'[데모 수학학원 주간 리포트]\n%s 학생 (%s · %s)\n\n3월부터 수업 기록이 쌓이고 있습니다. 학부모 포털에서 확인하세요.\n\n담당: %s',
      s.name, s.grade, s.school,
      CASE WHEN s.class_id IN (v_c1a, v_c2a) THEN '이강사'
           WHEN s.class_id IN (v_c2b, v_c3a) THEN '박강사'
           ELSE '최강사' END
    ),
    CASE WHEN row_number() OVER (ORDER BY s.name) <= 12 THEN now() - interval '3 days' ELSE NULL END,
    now() - (row_number() OVER (ORDER BY s.name)) * interval '10 hours'
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy, v_stu_tm)
  ORDER BY s.name
  LIMIT 18;

  INSERT INTO public.consultation_followups (academy_id, student_id, consultation_card_id, title, memo, due_date, status)
  VALUES
    (v_academy_id, v_stu_mj, v_card_mj, '함수 그래프 오답노트', '이동·대칭 유형 각 2문항', v_today + 3, 'pending'),
    (v_academy_id, v_stu_mj, v_card_mj, '숙제 체크(학부모)', '주 3회 제출 확인', v_today + 7, 'pending'),
    (v_academy_id, v_stu_sy, v_card_sy, '보강반 참여', '수요일 17:00 중2B', v_today + 2, 'pending'),
    (v_academy_id, v_stu_sy, v_card_sy, '연립방정식 보충', '조건식 세우기 5문제', v_today + 5, 'pending'),
    (v_academy_id, v_stu_dy, v_card_dy, '이차함수 예습', '내신 범위 선행', v_today + 7, 'pending'),
    (v_academy_id, v_stu_tm, v_card_tm, '인수분해 특강', '곱셈공식 집중', v_today + 4, 'pending');

  INSERT INTO public.consultation_followups (academy_id, student_id, title, memo, due_date, status)
  SELECT v_academy_id, s.id, '단원 점검', s.name || ' — 상담 후 1주차 확인',
    v_today + ((row_number() OVER (ORDER BY s.name) % 5 + 2)::integer), 'pending'
  FROM public.students s
  WHERE s.academy_id = v_academy_id AND s.status IN ('consultation', 'attention')
  LIMIT 10;

  -- ── 상담 예약·기록 (3월~) ──
  v_sess_mj := gen_random_uuid();
  v_sess_sy := gen_random_uuid();
  v_sess_tm := gen_random_uuid();
  v_sess_dy := gen_random_uuid();

  INSERT INTO public.counseling_sessions (
    id, academy_id, student_id, consultation_card_id, session_type, status,
    scheduled_at, completed_at, title, summary, parent_message_draft,
    counselor_id, parent_id, created_by, created_at, updated_at,
    transcript, transcript_source
  ) VALUES
    (v_sess_mj, v_academy_id, v_stu_mj, v_card_mj, 'learning', 'scheduled',
     (v_today + 1)::timestamptz + time '14:00', NULL,
     '김민준 학습 상담 (함수·숙제)',
     '3월부터 함수 단원 진행. 숙제 미제출·그래프 오답 반복. 학부모 협조 필요.',
     E'안녕하세요, 김민준 학부모님. 내일 오후 2시 상담 일정 안내드립니다. 함수 숙제·오답노트 관련 논의 예정입니다.',
     v_staff_admin, v_parent_record_id, v_admin_id,
     (v_seed_start + 45)::timestamptz, now() - interval '1 day', NULL, NULL),
    (v_sess_sy, v_academy_id, v_stu_sy, v_card_sy, 'parent', 'completed',
     (v_today - 10)::timestamptz + time '11:00', (v_today - 10)::timestamptz + time '11:40',
     '박서연 학부모 전화 상담',
     '점수 하락(88→62) 확인. 중2B 보강반 수요일 편성 합의. 연립방정식 보충 과제 전달.',
     '보강반 일정 확정 문자 발송 완료.',
     v_staff_t1, NULL, v_teacher1_id,
     (v_today - 12)::timestamptz, (v_today - 10)::timestamptz,
     E'[상담 요약]\n학부모: 최근 시험 성적 하락 우려\n강사: 함수→연립 전환 구간 취약, 보강반 4회 권장\n합의: 수요 17:00 중2B 보강 참여',
     'ai_summary'),
    (v_sess_tm, v_academy_id, v_stu_tm, v_card_tm, 'learning', 'followup_needed',
     (v_today - 3)::timestamptz + time '16:30', (v_today - 3)::timestamptz + time '17:10',
     '황태민 인수분해 상담',
     '인수분해 4주 정체. 숙제 미제출 누적. 특강 안내 후 학부모 회신 대기.',
     NULL,
     v_staff_t2, NULL, v_teacher2_id,
     (v_today - 5)::timestamptz, (v_today - 2)::timestamptz, NULL, NULL),
    (v_sess_dy, v_academy_id, v_stu_dy, v_card_dy, 'learning', 'completed',
     (v_today - 20)::timestamptz + time '15:00', (v_today - 20)::timestamptz + time '15:45',
     '이도윤 회복세 점검 상담',
     '보강 후 52→82 회복. 숙제 제출률 개선. 내신 예습 일정 공유.',
     '다음 주 예습 범위 안내 완료.',
     v_staff_t2, NULL, v_teacher2_id,
     (v_today - 22)::timestamptz, (v_today - 20)::timestamptz,
     E'[상담 STT]\n강사: 보강 2회 후 자신감 회복\n학부모: 가정 학습 시간 확보 약속',
     'stt');

  INSERT INTO public.counseling_sessions (
    academy_id, student_id, session_type, status, scheduled_at, title, summary, counselor_id, created_by, created_at
  )
  SELECT v_academy_id, s.id, 'learning',
    CASE WHEN row_number() OVER (ORDER BY s.name) <= 2 THEN 'scheduled' ELSE 'completed' END,
    (v_today + ((row_number() OVER (ORDER BY s.name) % 5)::int))::timestamptz + time '10:00',
    s.name || ' 정기 학습 상담',
    s.name || ' (' || s.grade || ') — 3월 이후 수업·숙제 종합 점검.',
    CASE s.class_id
      WHEN v_c1a THEN v_staff_t1 WHEN v_c2a THEN v_staff_t1
      WHEN v_c2b THEN v_staff_t2 WHEN v_c3a THEN v_staff_t2
      ELSE v_staff_t3
    END,
    v_admin_id,
    (v_seed_start + ((row_number() OVER (ORDER BY s.name) * 2)::int))::timestamptz
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND s.status IN ('consultation', 'attention')
    AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy, v_stu_tm, v_stu_dh)
  LIMIT 6;

  -- ── 수납 (3·4·5월 · 학생별) ──
  INSERT INTO public.student_payments (
    academy_id, student_id, parent_id, title, billing_month, amount, due_date, status, paid_at, payment_method, memo, created_by
  )
  SELECT
    v_academy_id, p.student_id,
    CASE WHEN p.student_id = v_stu_mj THEN v_parent_record_id ELSE NULL END,
    to_char(p.due_date, 'YYYY') || '년 ' || to_char(p.due_date, 'MM') || '월 수강료',
    p.billing_month,
    p.amount, p.due_date, p.pay_status,
    CASE WHEN p.pay_status = 'paid' THEN (p.due_date + 2)::timestamptz + time '10:00' ELSE NULL END,
    CASE WHEN p.pay_status = 'paid' THEN '계좌이체' ELSE NULL END,
    CASE WHEN p.pay_status = 'overdue' THEN '1차 독촉 문자 발송(데모)' ELSE NULL END,
    v_admin_id
  FROM (
    SELECT s.id AS student_id, m.billing_month, m.due_date,
      CASE s.grade WHEN '고1' THEN 350000 WHEN '중3' THEN 320000 ELSE 280000 END AS amount,
      CASE
        WHEN s.id = v_stu_mj AND m.billing_month = '2026-03' THEN 'paid'
        WHEN s.id = v_stu_mj AND m.billing_month = '2026-04' THEN 'pending'
        WHEN s.id = v_stu_mj AND m.billing_month = '2026-05' THEN 'overdue'
        WHEN m.billing_month = '2026-03' THEN 'paid'
        WHEN m.billing_month = '2026-04' AND (row_number() OVER (PARTITION BY m.billing_month ORDER BY s.name) % 8 = 0) THEN 'overdue'
        WHEN m.billing_month = '2026-04' AND (row_number() OVER (PARTITION BY m.billing_month ORDER BY s.name) % 6 = 0) THEN 'pending'
        WHEN m.billing_month = '2026-05' AND (row_number() OVER (PARTITION BY m.billing_month ORDER BY s.name) % 7 = 0) THEN 'overdue'
        WHEN m.billing_month = '2026-05' AND (row_number() OVER (PARTITION BY m.billing_month ORDER BY s.name) % 5 = 0) THEN 'pending'
        ELSE 'paid'
      END AS pay_status
    FROM public.students s
    CROSS JOIN (
      VALUES ('2026-03', '2026-03-05'::date), ('2026-04', '2026-04-05'::date), ('2026-05', '2026-05-05'::date)
    ) AS m(billing_month, due_date)
    WHERE s.academy_id = v_academy_id AND s.enrollment_status = 'active'
  ) p;

  -- ── 공지 (3월 개학~) ──
  INSERT INTO public.announcements (
    academy_id, title, body, target_type, class_id, student_id, status, published_at, created_by, created_at
  ) VALUES
    (v_academy_id, '2026학년도 1학기 개강 안내',
     E'데모 수학학원을 이용해 주셔서 감사합니다.\n\n· 3월 1일(일) 정규 수업 시작\n· 시간표는 학부모 포털에서 확인\n· 문의: 원장실',
     'all', NULL, NULL, 'published', v_seed_start::timestamptz + interval '9 hours', v_admin_id, v_seed_start::timestamptz),
    (v_academy_id, '5월 중간고사 내신 대비 안내',
     E'5월 4째 주 학교 중간고사 대비 특강을 진행합니다.\n반별 보강 일정은 담당 강사가 개별 안내드립니다.',
     'all', NULL, NULL, 'published', '2026-05-10 09:00+09'::timestamptz, v_admin_id, '2026-05-09'::timestamptz),
    (v_academy_id, '중2A반 함수 그래프 보강 안내',
     E'중2A반 학부모님께\n\n함수의 그래프 단원 보강 수업이 이번 주 금요일 15:00에 진행됩니다.',
     'class', v_c2a, NULL, 'published', (v_today - 7)::timestamptz, v_teacher1_id, (v_today - 8)::timestamptz),
    (v_academy_id, '김민준 학생 숙제·상담 안내',
     E'김민준 학부모님, 함수 단원 숙제 미제출이 누적되어 상담을 요청드립니다. 포털 메시지로 회신 부탁드립니다.',
     'student', NULL, v_stu_mj, 'published', (v_today - 2)::timestamptz, v_admin_id, (v_today - 2)::timestamptz),
    (v_academy_id, '6월 여름 특강 (초안)',
     E'6월 특강 반 편성안 — 검토 후 게시 예정',
     'all', NULL, NULL, 'draft', NULL, v_admin_id, v_today::timestamptz);

  -- ── 학부모 문의 ──
  INSERT INTO public.parent_messages (
    academy_id, student_id, parent_user_id, parent_id, subject, body, status,
    staff_reply, ai_draft_reply, replied_by, replied_at, source_session_id, created_at
  ) VALUES
    (v_academy_id, v_stu_mj, v_parent_id, v_parent_record_id,
     '김민준 함수 숙제 관련 문의',
     E'안녕하세요. 민준이가 요즘 함수 숙제를 자주 못 내는데, 학원에서도 비슷하게 보이나요? 가정에서 어떻게 도와드리면 좋을지 조언 부탁드립니다.',
     'pending', NULL,
     E'안녕하세요, 김학부모님. 데모 수학학원입니다.\n\n민준 학생은 함수 그래프 유형에서 숙제 미제출이 3회 누적되었습니다. 이동·대칭 그래프 오답노트 2문항씩 권장드리며, 내일 오후 2시 상담에서 자세히 논의하겠습니다.\n\n— 이강사',
     NULL, NULL, NULL, now() - interval '6 hours'),
    (v_academy_id, v_stu_mj, v_parent_id, v_parent_record_id,
     '상담 일정 확인',
     '내일 오후 2시 상담 가능합니다. Zoom 가능한가요?',
     'answered',
     E'네, 가능합니다. 상담 10분 전 링크 문자 드리겠습니다. 감사합니다.',
     NULL, v_admin_id, now() - interval '2 days', NULL, now() - interval '3 days');

  -- ── 채팅 (김민준 1:1 + 반 단톡) ──
  v_chat_mj_parent := gen_random_uuid();
  v_chat_mj_student := gen_random_uuid();
  v_chat_c2a := gen_random_uuid();
  v_chat_c3a := gen_random_uuid();

  INSERT INTO public.chat_channels (id, academy_id, type, student_id, direct_audience, class_id, created_at, updated_at) VALUES
    (v_chat_mj_parent, v_academy_id, 'direct', v_stu_mj, 'parent', NULL, (v_seed_start + 10)::timestamptz, now() - interval '1 hour'),
    (v_chat_mj_student, v_academy_id, 'direct', v_stu_mj, 'student', NULL, (v_seed_start + 12)::timestamptz, now() - interval '2 hours'),
    (v_chat_c2a, v_academy_id, 'class_group', NULL, NULL, v_c2a, (v_seed_start + 5)::timestamptz, now() - interval '30 minutes'),
    (v_chat_c3a, v_academy_id, 'class_group', NULL, NULL, v_c3a, (v_seed_start + 7)::timestamptz, now() - interval '45 minutes');

  INSERT INTO public.chat_messages (channel_id, sender_id, sender_role, body, created_at) VALUES
    (v_chat_mj_parent, v_parent_id, 'parent', '민준 이번 주 함수 숙제 범위가 어디까지인가요?', (v_today - 5)::timestamptz),
    (v_chat_mj_parent, v_teacher1_id, 'teacher', '일차함수 그래프 3~5번, 이동·대칭 유형 포함입니다. 어려우면 사진 보내주세요.', (v_today - 5)::timestamptz + interval '20 minutes'),
    (v_chat_mj_parent, v_parent_id, 'parent', '네, 확인했습니다. 내일 상담도 그때 뵙겠습니다.', (v_today - 4)::timestamptz),
    (v_chat_mj_parent, v_admin_id, 'owner', '김학부모님, 내일 오후 2시 상담 일정 리마인드 드립니다.', now() - interval '1 day'),
    (v_chat_mj_student, v_student_user_id, 'student', '선생님, 4번 문제 풀이 방법을 모르겠어요.', (v_today - 3)::timestamptz),
    (v_chat_mj_student, v_teacher1_id, 'teacher', '기울기부터 구해보자. 노트에 적어둔 공식 확인해봐.', (v_today - 3)::timestamptz + interval '15 minutes'),
    (v_chat_c2a, v_teacher1_id, 'teacher', '중2A반 학부모님/학생 여러분, 금요일 보강 15:00 201호입니다.', (v_today - 7)::timestamptz),
    (v_chat_c2a, v_student_user_id, 'student', '보강 참석합니다.', (v_today - 6)::timestamptz),
    (v_chat_c3a, v_teacher2_id, 'teacher', '중3A 인수분해 특강 자료 PDF 포털에 올렸습니다.', (v_today - 2)::timestamptz);

  INSERT INTO public.chat_channel_reads (user_id, channel_id, last_read_at) VALUES
    (v_parent_id, v_chat_mj_parent, now() - interval '1 hour'),
    (v_teacher1_id, v_chat_mj_parent, now()),
    (v_student_user_id, v_chat_mj_student, now() - interval '2 hours'),
    (v_teacher1_id, v_chat_c2a, now() - interval '30 minutes');

  -- ── EduFlow 구독 (3월 체험 → Growth) ──
  v_sub_id := gen_random_uuid();
  INSERT INTO public.academy_subscriptions (
    id, academy_id, status, plan, trial_started_at, trial_ends_at,
    current_period_start, current_period_end, payment_provider
  ) VALUES (
    v_sub_id, v_academy_id, 'active', 'growth',
    v_seed_start::timestamptz, (v_seed_start + 14)::timestamptz,
    (v_seed_start + 14)::timestamptz, (v_seed_start + interval '1 year')::timestamptz, 'mock'
  );

  INSERT INTO public.subscription_payments (academy_id, subscription_id, plan, amount_krw, status, provider, paid_at) VALUES
    (v_academy_id, v_sub_id, 'growth', 79000, 'paid', 'mock', (v_seed_start + 14)::timestamptz),
    (v_academy_id, v_sub_id, 'growth', 79000, 'paid', 'mock', (v_seed_start + 44)::timestamptz);

  INSERT INTO public.academy_integrations (academy_id, sms_enabled, kakao_enabled, sms_sender_name, kakao_channel_name)
  VALUES (v_academy_id, true, true, '데모수학', '데모수학학원');

  INSERT INTO public.academy_info (academy_id, category, title, content, sort_order) VALUES
    (v_academy_id, 'intro', '학원 소개',
     E'데모 수학학원은 중·고등 수학 내신 전문 학원입니다.\n2026년 3월 정식 런칭, 대치·역삼권 학생 50명 재원 중.', 1),
    (v_academy_id, 'curriculum', '수업 커리큘럼',
     E'· 중1: 기초 연산 → 방정식\n· 중2~3: 내신 단원별 + 모의\n· 고1: 공통수학1\n주 2회 정규 + 보강', 1),
    (v_academy_id, 'fees', '수강료 안내',
     E'중1~2: 280,000원/월\n중3: 320,000원/월\n고1: 350,000원/월\n(재료비 별도)', 1),
    (v_academy_id, 'rules', '운영 규정',
     E'· 지각 3회 시 학부모 상담\n· 숙제 미제출 2회 연속 시 담당 강사 연락\n· 보강은 사전 예약', 1),
    (v_academy_id, 'teachers', '강사진',
     E'· 이강사 — 중1A·중2A 담당\n· 박강사 — 중2B·중3A\n· 최강사 — 중3B·고1', 1),
    (v_academy_id, 'faq', '자주 묻는 질문',
     E'Q. 포털은 어떻게 연결하나요?\nA. 학원 코드 DEMO-MATH-26 입력 후 학생 이름으로 연결 요청.', 1);

  INSERT INTO public.notification_logs (
    academy_id, channel, recipient_label, recipient_user_id, student_id, message, template_key, status, sent_at, created_by, created_at
  ) VALUES
    (v_academy_id, 'kakao', '김학부모', v_parent_id, v_stu_mj,
     '[데모수학] 3월 수강료 납부 확인 감사합니다.', 'payment_paid', 'sent', (v_seed_start + 7)::timestamptz, v_admin_id, (v_seed_start + 7)::timestamptz),
    (v_academy_id, 'kakao', '김학부모', v_parent_id, v_stu_mj,
     '[데모수학] 5월 수강료 납부 기한(5/5) 안내드립니다.', 'payment_due', 'sent', (v_today - 10)::timestamptz, v_admin_id, (v_today - 10)::timestamptz),
    (v_academy_id, 'sms', '중2A반', NULL, NULL,
     '중2A 함수 보강 금요 15:00 201호', 'schedule_makeup', 'sent', (v_today - 7)::timestamptz, v_teacher1_id, (v_today - 7)::timestamptz),
    (v_academy_id, 'in_app', '전체 학부모', NULL, NULL,
     '5월 중간고사 내신 대비 공지 게시', 'announcement', 'sent', '2026-05-10 09:30+09'::timestamptz, v_admin_id, '2026-05-10 09:30+09'::timestamptz),
    (v_academy_id, 'kakao', '김학부모', v_parent_id, v_stu_mj,
     '함수 숙제 미제출 알림 — 포털 확인', 'homework_missing', 'demo', (v_today - 1)::timestamptz, v_teacher1_id, (v_today - 1)::timestamptz);

  INSERT INTO public.user_notification_prefs (user_id, prefs) VALUES
    (v_parent_id, '{"payment":true,"homework":true,"grades":true,"announcement":true,"chat":true}'::jsonb),
    (v_student_user_id, '{"homework":true,"grades":true,"announcement":true,"chat":true}'::jsonb)
  ON CONFLICT (user_id) DO UPDATE SET prefs = EXCLUDED.prefs;

  -- ── 신입 상담 파이프라인 ──
  v_prospect1 := gen_random_uuid();
  v_prospect2 := gen_random_uuid();
  v_prospect3 := gen_random_uuid();

  INSERT INTO public.students (id, academy_id, class_id, name, school, grade, status, enrollment_status, registered_at)
  VALUES
    (v_prospect1, v_academy_id, NULL, '오준서', '대치중학교', '중2', 'stable', 'prospect', NULL),
    (v_prospect2, v_academy_id, NULL, '배서윤', '역삼중학교', '중3', 'stable', 'prospect', NULL),
    (v_prospect3, v_academy_id, NULL, '한지아', '강남고등학교', '고1', 'stable', 'prospect', NULL);

  INSERT INTO public.intake_consultations (
    academy_id, student_id, prospect_name, grade, school, parent_name, parent_phone,
    interested_subjects, preferred_class, counselor_id, acquisition_source,
    intake_status, consultation_content, registration_likelihood, next_action, followup_date, registered, created_at
  ) VALUES
    (v_academy_id, v_prospect1, '오준서', '중2', '대치중학교', '오학부모', '010-1111-2222',
     '수학', '중2A', v_teacher1_id, 'naver_search', 'scheduled',
     '일차함수 기초 상담 예정', 'high', 'level_test', v_today + 3, false, (v_today - 2)::timestamptz),
    (v_academy_id, v_prospect2, '배서윤', '중3', '역삼중학교', '배학부모', '010-3333-4444',
     '수학 내신', '중3A', v_teacher2_id, 'parent_referral', 'completed',
     '인수분해 취약, 중3A 추천', 'medium', 'trial_lesson', v_today + 5, false, (v_today - 8)::timestamptz),
    (v_academy_id, v_prospect3, '한지아', '고1', '강남고등학교', '한학부모', '010-5555-6666',
     '공통수학1', '고1', v_teacher3_id, 'walk_in', 'on_hold',
     '타 학원 재원 중, 6월 재상담', 'low', 'on_hold', v_today + 30, false, (v_today - 15)::timestamptz);

  -- ── 재등록 · 리텐션 ──
  INSERT INTO public.reregistration_records (academy_id, student_id, term_id, status, counseling_session_id, parent_id, memo, created_at)
  SELECT v_academy_id, s.id, v_term_id,
    CASE
      WHEN s.id IN (v_stu_mj, v_stu_tm) THEN 'pending'
      WHEN s.id = v_stu_sy THEN 'contacted'
      WHEN s.id = v_stu_dy THEN 'confirmed'
      ELSE CASE WHEN row_number() OVER (ORDER BY s.name) % 5 = 0 THEN 'pending' ELSE 'confirmed' END
    END,
    CASE WHEN s.id = v_stu_sy THEN v_sess_sy ELSE NULL END,
    CASE WHEN s.id = v_stu_mj THEN v_parent_record_id ELSE NULL END,
    s.name || ' — 2학기 재등록 의사 확인',
    (v_today - 14)::timestamptz
  FROM public.students s
  WHERE s.academy_id = v_academy_id AND s.enrollment_status = 'active';

  -- ── Risk signals (Agent 데모) ──
  INSERT INTO public.student_risk_signals (academy_id, student_id, risk_level, reason, signals, created_at)
  SELECT v_academy_id, v_stu_mj, 'consultation',
    '함수 그래프 유사 오답 반복 · 숙제 미제출 3회 · 점수 하락',
    '[{"id":"hw_missing","label":"숙제 미제출 3회"},{"id":"score_down","label":"6주 점수 하락"},{"id":"repeat_tag","label":"함수 오답 반복"}]'::jsonb,
    now() - interval '6 hours';

  INSERT INTO public.student_risk_signals (academy_id, student_id, risk_level, reason, signals, created_at) VALUES
    (v_academy_id, v_stu_sy, 'makeup', '점수 88→62 · 보강반 편성 검토', '[{"id":"score_down","label":"급격한 점수 하락"}]'::jsonb, now() - interval '6 hours'),
    (v_academy_id, v_stu_tm, 'consultation', '인수분해 4주 정체 · 숙제 미제출 누적', '[{"id":"unit_stuck","label":"단원 정체"}]'::jsonb, now() - interval '5 hours'),
    (v_academy_id, v_stu_dh, 'makeup', '결석 1회 · 기하 종합 60점', '[{"id":"absent","label":"결석"},{"id":"low_score","label":"기하 취약"}]'::jsonb, now() - interval '5 hours'),
    (v_academy_id, v_stu_dy, 'recovering', '보강 후 52→82 회복', '[{"id":"recovering","label":"회복 추세"}]'::jsonb, now() - interval '4 hours');

  INSERT INTO public.student_risk_signals (academy_id, student_id, risk_level, reason, signals, created_at)
  SELECT v_academy_id, s.id,
    CASE s.status WHEN 'consultation' THEN 'consultation' WHEN 'attention' THEN 'attention' ELSE 'stable' END,
    s.name || ' — Risk Agent 자동 분류 (' || s.grade || ')',
    jsonb_build_array(jsonb_build_object('id', 'auto', 'label', '수업 기록 기반')),
    now() - (row_number() OVER (ORDER BY s.name)) * interval '30 minutes'
  FROM public.students s
  WHERE s.academy_id = v_academy_id
    AND s.id NOT IN (v_stu_mj, v_stu_sy, v_stu_dy, v_stu_tm, v_stu_dh);

  INSERT INTO public.student_risk_snapshots (
    academy_id, student_id, snapshot_type, risk_level, score, reason, signals, source_table, created_at
  )
  SELECT v_academy_id, srs.student_id, 'learning', srs.risk_level, 0, srs.reason, srs.signals, 'student_risk_signals', srs.created_at
  FROM public.student_risk_signals srs
  WHERE srs.academy_id = v_academy_id;

  INSERT INTO public.student_risk_snapshots (academy_id, student_id, snapshot_type, risk_level, score, reason, signals, created_at)
  VALUES
    (v_academy_id, v_stu_mj, 'retention', 'high', 78, '숙제 미제출·성적 하락·5월 미납', '[{"id":"payment","label":"미납"}]'::jsonb, now() - interval '1 day'),
    (v_academy_id, v_stu_sy, 'retention', 'medium', 55, '성적 급락 후 보강 중', '[{"id":"score","label":"88→62"}]'::jsonb, now() - interval '2 days'),
    (v_academy_id, v_stu_tm, 'retention', 'high', 72, '단원 정체·상담 후속 필요', '[]'::jsonb, now() - interval '1 day');

  -- ── Agent logs (Proactive + Workflow 시연) ──
  INSERT INTO public.agent_logs (academy_id, agent_type, student_id, status, action, result, created_at) VALUES
    (v_academy_id, 'risk_detection', NULL, 'completed', 'proactive_daily_scan',
     jsonb_build_object('processed', 50, 'consultation', 8, 'makeup', 4), now() - interval '8 hours'),
    (v_academy_id, 'risk_detection', v_stu_mj, 'completed', 'student_risk_assessed',
     jsonb_build_object('studentName', '김민준', 'riskLevel', 'consultation'), now() - interval '7 hours 55 minutes'),
    (v_academy_id, 'counseling', v_stu_mj, 'completed', 'counseling_brief_generated',
     jsonb_build_object('studentName', '김민준', 'cardId', v_card_mj::text), now() - interval '7 hours 50 minutes'),
    (v_academy_id, 'parent_communication', v_stu_mj, 'completed', 'weekly_report_draft',
     jsonb_build_object('studentName', '김민준'), now() - interval '7 hours 45 minutes'),
    (v_academy_id, 'counseling', v_stu_tm, 'completed', 'counseling_brief_generated',
     jsonb_build_object('studentName', '황태민'), now() - interval '7 hours 30 minutes'),
    (v_academy_id, 'parent_communication', v_stu_tm, 'completed', 'weekly_report_draft',
     jsonb_build_object('studentName', '황태민'), now() - interval '7 hours 28 minutes'),
    (v_academy_id, 'parent_rag', v_stu_mj, 'completed', 'parent_question',
     jsonb_build_object('mode', 'vector', 'sources', jsonb_build_array('lesson_log', 'consultation_card')), now() - interval '2 hours'),
    (v_academy_id, 'dashboard', NULL, 'completed', 'proactive_daily_complete',
     jsonb_build_object('workflowsRun', 3, 'indexedStudents', 12), now() - interval '8 hours');

  -- ── Agent jobs (워크플로 패널) ──
  INSERT INTO public.agent_jobs (academy_id, student_id, workflow_type, current_step, status, result, created_at, updated_at) VALUES
    (v_academy_id, v_stu_mj, 'student_care', 'completed', 'completed',
     jsonb_build_object('triggered', true, 'riskLevel', 'consultation', 'consultationCardId', v_card_mj::text),
     now() - interval '7 hours', now() - interval '7 hours 40 minutes'),
    (v_academy_id, v_stu_tm, 'student_care', 'parent_communication', 'running',
     jsonb_build_object('triggered', true, 'consultationCardId', v_card_tm::text),
     now() - interval '6 hours', now() - interval '30 minutes'),
    (v_academy_id, v_stu_sy, 'student_care', 'completed', 'completed',
     jsonb_build_object('triggered', true, 'riskLevel', 'makeup'),
     now() - interval '2 days', now() - interval '2 days'),
    (v_academy_id, v_stu_dh, 'student_care', 'counseling', 'running',
     jsonb_build_object('triggered', true),
     now() - interval '1 hour', now() - interval '20 minutes');

  -- Vector RAG용 텍스트 청크 (embedding은 앱에서 index-student로 생성)
  INSERT INTO public.student_memory_chunks (academy_id, student_id, source_type, source_id, title, content, metadata)
  SELECT v_academy_id, v_stu_mj, 'lesson_log', ll.id,
    '수업기록 ' || to_char(ll.lesson_date, 'YYYY-MM-DD'),
    format(E'[수업기록]\n김민준\n%s\n%s\n숙제: %s\n점수 %s점\n%s',
      ll.lesson_date, ll.unit, ll.homework_status, coalesce(ll.test_score::text, '—'), coalesce(ll.memo, '')),
    jsonb_build_object('unit', ll.unit)
  FROM public.lesson_logs ll
  WHERE ll.student_id = v_stu_mj AND ll.lesson_date >= v_today - 40
  LIMIT 8;

  INSERT INTO public.student_memory_chunks (academy_id, student_id, source_type, source_id, title, content, metadata)
  VALUES
    (v_academy_id, v_stu_mj, 'consultation_card', v_card_mj, '상담 카드',
     E'[상담카드]\n김민준\n함수·그래프 유사 오답 4주. 숙제 미제출 3회. 상담 권장.\n학부모 연락 요청.',
     '{"status":"pending"}'::jsonb),
    (v_academy_id, v_stu_mj, 'risk_signal', NULL, '위험 신호',
     E'[위험신호]\n김민준\n상담 권장\n함수 그래프 유사 오답 반복 · 숙제 미제출 3회',
     '{}'::jsonb),
    (v_academy_id, v_stu_mj, 'student_profile', NULL, '학생 프로필',
     E'[학생프로필]\n김민준\n대치중학교 중2\n중2A반 (내신)\n상태: 상담 권장',
     '{}'::jsonb);

  RAISE NOTICE '데모 수학학원 시드 완료 — 학생 50명+신입3, ERP 전기능, 3월~% 데이터. academy_id=%', v_today, v_academy_id;
END $$;

COMMIT;
