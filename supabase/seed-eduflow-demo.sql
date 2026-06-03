-- =============================================================================
-- 해성수학전문학원 시연용 시드 (seed-eduflow-demo.sql)
-- 학생 40명 · 반 6개 · 6주 수업기록 · Agent/RAG 데모 데이터
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_admin_id    uuid;
  v_parent_id   uuid;
  v_student_id  uuid;
  v_academy_id  uuid;
  v_c1a uuid; v_c2a uuid; v_c2b uuid; v_c3a uuid; v_c3b uuid; v_c1h uuid;
  v_stu_mj uuid; v_stu_sy uuid; v_stu_dy uuid; v_stu_tm uuid; v_stu_dh uuid;
  v_today_dow int;
  v_today date := current_date;
  v_d date;
  v_i int;
  v_card_mj uuid; v_card_sy uuid; v_card_dy uuid; v_card_tm uuid;
  rec record;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'okto0914@gmail.com' LIMIT 1;
  SELECT id INTO v_parent_id FROM auth.users WHERE lower(email) = 'okto0915@gmail.com' LIMIT 1;
  SELECT id INTO v_student_id FROM auth.users WHERE lower(email) = 'okto0916@gmail.com' LIMIT 1;

  IF v_admin_id IS NULL OR v_parent_id IS NULL OR v_student_id IS NULL THEN
    RAISE EXCEPTION 'Auth 계정 3개가 필요합니다. scripts/create-demo-auth-users.mjs 또는 /auth 가입 후 다시 실행하세요.';
  END IF;

  -- migration 014 미적용 DB 호환 (상담 카드 대기/완료)
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consultation_status text NOT NULL DEFAULT 'pending'
      CHECK (consultation_status IN ('pending', 'completed'));
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consulted_at timestamptz;
  ALTER TABLE public.consultation_cards
    ADD COLUMN IF NOT EXISTS consultation_note text;

  ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS parent_invite_email text;
  ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS student_invite_email text;

  v_today_dow := extract(dow from v_today)::int;

  -- Agent / Vector 테이블 (017+)
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
  VALUES (v_academy_id, '해성수학전문학원', v_admin_id, 'HAESUNG-26');
  UPDATE public.users SET academy_id = v_academy_id WHERE id = v_admin_id;

  v_c1a := gen_random_uuid();
  v_c2a := gen_random_uuid();
  v_c2b := gen_random_uuid();
  v_c3a := gen_random_uuid();
  v_c3b := gen_random_uuid();
  v_c1h := gen_random_uuid();

  INSERT INTO public.classes (id, academy_id, teacher_id, name, grade) VALUES
    (v_c1a, v_academy_id, v_admin_id, '중1A반 (기초)', '중1'),
    (v_c2a, v_academy_id, v_admin_id, '중2A반 (내신)', '중2'),
    (v_c2b, v_academy_id, v_admin_id, '중2B반 (심화)', '중2'),
    (v_c3a, v_academy_id, v_admin_id, '중3A반 (내신)', '중3'),
    (v_c3b, v_academy_id, v_admin_id, '중3B반 (심화)', '중3'),
    (v_c1h, v_academy_id, v_admin_id, '고1반 (공통수학1)', '고1');

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
    -- 중2A
    (v_stu_mj, v_c2a, '김민준', '대치중학교', '중2', 'consultation', true, 'mj'),
    (v_stu_sy, v_c2a, '박서연', '대치중학교', '중2', 'consultation', true, 'sy'),
    (gen_random_uuid(), v_c2a, '최하은', '대치중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '정우빈', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '한지우', '역삼중학교', '중2', 'attention', false, null),
    (gen_random_uuid(), v_c2a, '오세린', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '윤채아', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2a, '류건호', '대치중학교', '중2', 'attention', false, null),
    -- 중2B
    (gen_random_uuid(), v_c2b, '강민재', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '윤서준', '역삼중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '임도현', '강남중학교', '중2', 'attention', false, null),
    (gen_random_uuid(), v_c2b, '송나윤', '강남중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '배준혁', '대치중학교', '중2', 'stable', false, null),
    (gen_random_uuid(), v_c2b, '표시율', '대치중학교', '중2', 'consultation', false, null),
    (gen_random_uuid(), v_c2b, '차은별', '역삼중학교', '중2', 'stable', false, null),
    -- 중3A
    (v_stu_dy, v_c3a, '이도윤', '대치중학교', '중3', 'attention', true, 'dy'),
    (gen_random_uuid(), v_c3a, '정수아', '대치중학교', '중3', 'stable', false, null),
    (v_stu_tm, v_c3a, '황태민', '역삼중학교', '중3', 'consultation', true, 'tm'),
    (gen_random_uuid(), v_c3a, '노예린', '강남중학교', '중3', 'stable', false, null),
    (v_stu_dh, v_c3a, '서동현', '강남중학교', '중3', 'consultation', true, 'dh'),
    (gen_random_uuid(), v_c3a, '진아름', '대치중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3a, '피승민', '역삼중학교', '중3', 'attention', false, null),
    (gen_random_uuid(), v_c3a, '곽하율', '강남중학교', '중3', 'stable', false, null),
    -- 중3B
    (gen_random_uuid(), v_c3b, '나현준', '대치중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3b, '도승우', '역삼중학교', '중3', 'consultation', false, null),
    (gen_random_uuid(), v_c3b, '라유진', '강남중학교', '중3', 'stable', false, null),
    (gen_random_uuid(), v_c3b, '마정호', '대치중학교', '중3', 'attention', false, null),
    (gen_random_uuid(), v_c3b, '반소율', '역삼중학교', '중3', 'stable', false, null),
    -- 고1
    (gen_random_uuid(), v_c1h, '문채원', '강남고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '조현우', '강남고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '홍승기', '대치고등학교', '고1', 'attention', false, null),
    (gen_random_uuid(), v_c1h, '권다은', '대치고등학교', '고1', 'stable', false, null),
    (gen_random_uuid(), v_c1h, '금서윤', '역삼고등학교', '고1', 'consultation', false, null),
    (gen_random_uuid(), v_c1h, '탁지훈', '역삼고등학교', '고1', 'stable', false, null);

  INSERT INTO public.students (
    id, academy_id, class_id, parent_user_id, student_user_id,
    parent_invite_email, student_invite_email, name, school, grade, status
  )
  SELECT
    d.id, v_academy_id, d.class_id,
    CASE WHEN d.id = v_stu_mj THEN v_parent_id ELSE NULL END,
    CASE WHEN d.id = v_stu_mj THEN v_student_id ELSE NULL END,
    CASE WHEN d.id = v_stu_mj THEN 'okto0915@gmail.com' ELSE NULL END,
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

  -- 시간표 (정기 + 오늘)
  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c1a, v_admin_id, '중1A 정기 (월·수)', 1, '17:30', '19:00', 'regular', '101호', true, true),
    (v_academy_id, v_c1a, v_admin_id, '중1A 정기 (월·수)', 3, '17:30', '19:00', 'regular', '101호', true, true),
    (v_academy_id, v_c2a, v_admin_id, '중2A 정기 (월·수)', 1, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_c2a, v_admin_id, '중2A 정기 (월·수)', 3, '19:00', '20:30', 'regular', '201호', true, true),
    (v_academy_id, v_c2b, v_admin_id, '중2B 정기 (화·목)', 2, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_c2b, v_admin_id, '중2B 정기 (화·목)', 4, '19:00', '20:30', 'regular', '202호', true, true),
    (v_academy_id, v_c3a, v_admin_id, '중3A 정기 (화·목)', 2, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_c3a, v_admin_id, '중3A 정기 (화·목)', 4, '19:30', '21:00', 'regular', '203호', true, true),
    (v_academy_id, v_c3b, v_admin_id, '중3B 정기 (금)', 5, '19:30', '21:00', 'regular', '204호', true, true),
    (v_academy_id, v_c1h, v_admin_id, '고1 정기 (토)', 6, '10:00', '12:00', 'regular', '301호', true, true);

  INSERT INTO public.class_schedules (
    academy_id, class_id, teacher_id, title, day_of_week,
    start_time, end_time, schedule_type, location, is_recurring, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c2a, v_admin_id, '중2A 함수 보강', v_today_dow, '15:00', '16:30', 'makeup', '201호', false, true),
    (v_academy_id, v_c2b, v_admin_id, '중2B 정기', v_today_dow, '17:00', '18:30', 'regular', '202호', false, true),
    (v_academy_id, v_c3a, v_admin_id, '중3A 인수분해', v_today_dow, '19:30', '21:00', 'regular', '203호', false, true),
    (v_academy_id, v_c3b, v_admin_id, '중3B 모의', v_today_dow, '19:30', '21:00', 'regular', '204호', false, true),
    (v_academy_id, v_c1h, v_admin_id, '고1 공통수학1', v_today_dow, '10:00', '11:30', 'regular', '301호', false, true);

  INSERT INTO public.schedule_exceptions (
    academy_id, class_id, exception_date, exception_type, start_time, end_time, memo, is_visible_to_parent
  ) VALUES
    (v_academy_id, v_c2a, v_today + 2, 'makeup', '15:00', '16:30', '중2A 보강 — 함수 그래프·좌표평면', true),
    (v_academy_id, v_c3a, v_today + 4, 'canceled', NULL, NULL, '중3A 정기수업 휴강 (학교 행사)', true),
    (v_academy_id, v_c1h, v_today + 7, 'special', '14:00', '16:00', '고1 기말 대비 특강', true);

  -- ── 스토리 학생: 6주 상세 수업기록 ──
  FOR v_i IN 0..5 LOOP
    v_d := v_today - 35 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c2a, v_stu_mj, v_admin_id, v_d,
      (ARRAY['함수의 정의','일차함수','함수의 그래프','함수의 그래프','연립방정식','함수의 그래프'])[v_i+1],
      'present',
      (ARRAY['complete','partial','missing','missing','partial','missing'])[v_i+1],
      (ARRAY[82,78,74,70,68,65])[v_i+1],
      ARRAY['함수 오답','그래프 해석','숙제 루틴'],
      (ARRAY[
        '함수 정의·값 대입은 양호. 유사 유형 2문항에서 계산 실수.',
        '일차함수 그래프: 기울기 부호 혼동 1회. 오답노트 권장.',
        '함수 그래프 단원 테스트 74점. x절편·y절편 해석에서 반복 오답.',
        '숙제 미제출(그래프 3문제). 수업 중 풀이 속도 저하.',
        '연립방정식 전환 시 식 세우기 어려움. 함수 그래프 복습 병행 필요.',
        '소단원 평가 65점. 그래프 이동·대칭 유형 오답 3문항. 학부모 상담 권장.'
      ])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..5 LOOP
    v_d := v_today - 34 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c2a, v_stu_sy, v_admin_id, v_d,
      (ARRAY['일차함수','함수의 그래프','연립방정식','함수의 그래프','도형의 성질','함수 종합'])[v_i+1],
      CASE WHEN v_i = 4 THEN 'late' ELSE 'present' END,
      (ARRAY['complete','complete','partial','missing','partial','missing'])[v_i+1],
      (ARRAY[88,84,78,72,66,62])[v_i+1],
      ARRAY['계산 실수','개념 보완','속도 저하'],
      (ARRAY[
        '내신 대비 안정권. 풀이 과정 기록 양호.',
        '그래프 단원: 변곡점 표현에서 표기 오류 1건.',
        '연립방정식 응용 — 조건 해석 미흡. 보충 과제 부여.',
        '숙제 미제출 1회. 최근 2주 점수 하락 추세 시작.',
        '도형 단원 병행으로 집중도 분산. 지각 1회.',
        '함수 종합 62점. 보강반 편성 검토(중2B 심화 또는 1:1).'
      ])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..5 LOOP
    v_d := v_today - 33 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_dy, v_admin_id, v_d,
      (ARRAY['이차함수','이차함수','인수분해','이차함수','확률','이차함수'])[v_i+1],
      'present',
      (ARRAY['missing','partial','partial','complete','complete','complete'])[v_i+1],
      (ARRAY[52,58,64,72,78,82])[v_i+1],
      ARRAY['보강 후 회복','인수분해','자신감 회복'],
      (ARRAY[
        '이차함수 기초 취약. 보강 수업 1회 편성 완료.',
        '꼭짓점 좌표 구하기 — 공식 적용은 가능, 그래프 스케치 미흡.',
        '인수분해 특수식: (+)(+) 조합에서 실수 감소.',
        '단원 평가 72점. 숙제 제출률 개선.',
        '확률 기초 양호. 이차함수 복습 테스트 78점.',
        '회복세 유지. 다음 주 내신 범위 예습 권장.'
      ])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..5 LOOP
    v_d := v_today - 32 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_tm, v_admin_id, v_d,
      (ARRAY['인수분해','인수분해','인수분해','원의 성질','인수분해','확률'])[v_i+1],
      'present',
      (ARRAY['partial','missing','missing','partial','missing','partial'])[v_i+1],
      (ARRAY[70,68,66,64,63,61])[v_i+1],
      ARRAY['인수분해 정체','숙제 미제출','상담 권장'],
      (ARRAY[
        '인수분해 곱셈공식 — 동일 단원 3주차. 유형별 오답 분류 필요.',
        '숙제 2회 연속 미제출. 학원·가정 숙제 체크리스트 전달.',
        '단원 평가 66점. (a+b)² 전개에서 부호 실수 반복.',
        '원의 성질: 접선 조건 이해 부족. 인수분해 병행 복습.',
        '인수분해 응용 — 조건식 세우기에서 정체. 상담 카드 작성 예정.',
        '확률 전환 수업. 인수분해 보강 미참여 시 내신 리스크.'
      ])[v_i+1]);
  END LOOP;

  FOR v_i IN 0..5 LOOP
    v_d := v_today - 31 + (v_i * 7);
    INSERT INTO public.lesson_logs (academy_id, class_id, student_id, teacher_id, lesson_date, unit, attendance_status, homework_status, test_score, tags, memo)
    VALUES (v_academy_id, v_c3a, v_stu_dh, v_admin_id, v_d,
      (ARRAY['확률','원의 성질','원의 성질','이차함수','확률','기하 종합'])[v_i+1],
      CASE WHEN v_i = 2 THEN 'absent' ELSE 'present' END,
      (ARRAY['complete','partial','missing','partial','missing','partial'])[v_i+1],
      (ARRAY[76,72,58,68,64,60])[v_i+1],
      ARRAY['결석','보강 필요','기하 응용'],
      (ARRAY[
        '확률 트리다이어그램 양호.',
        '원의 성질 — 중선·접선 관계 혼동. 보충 영상 안내.',
        '결석(학교 행사). 보강 수업 예약 필요.',
        '이차함수 복습 68점. 결석분 보강 후 회복 중.',
        '확률 응용 — 경우의 수 중복/누락. 보강 권장.',
        '기하 종합 60점. 원·이차함수 혼합 유형 취약.'
      ])[v_i+1]);
  END LOOP;

  -- 나머지 학생: 5주 (학년·반별 단원, 전문 메모)
  FOR rec IN
    SELECT d.id, d.class_id, d.grade, d.status, d.name, d.school,
           row_number() OVER (ORDER BY d.name) AS rn
    FROM _demo_students d
    WHERE NOT d.is_spotlight
  LOOP
    FOR v_i IN 0..4 LOOP
      v_d := v_today - (28 - v_i * 7 - (rec.rn % 4)::int);
      INSERT INTO public.lesson_logs (
        academy_id, class_id, student_id, teacher_id, lesson_date, unit,
        attendance_status, homework_status, test_score, tags, memo
      ) VALUES (
        v_academy_id, rec.class_id, rec.id, v_admin_id, v_d,
        CASE rec.grade
          WHEN '중1' THEN (ARRAY['정수와 유리수','문자와 식','일차방정식','좌표평면','기본 도형'])[v_i+1]
          WHEN '중2' THEN (ARRAY['유리수 연산','일차함수','함수의 그래프','연립방정식','도형의 성질'])[v_i+1]
          WHEN '중3' THEN (ARRAY['제곱근','인수분해','이차함수','원의 성질','확률'])[v_i+1]
          ELSE (ARRAY['다항식','방정식과 부등식','도형의 방정식','집합','함수'])[v_i+1]
        END,
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
          '[%s] %s · %s · %s주차 — %s 단원 수업. %s. 담당: 김원장.',
          rec.grade, rec.name, rec.school,
          (v_i + 1)::text,
          CASE rec.grade WHEN '중1' THEN '중1 기초' WHEN '중2' THEN '중2 내신' WHEN '중3' THEN '중3 내신' ELSE '고1 공통' END,
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
  SELECT v_academy_id, t.class_id, t.id, v_admin_id, v_today,
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

  -- 상담 카드 (스토리 + 추가)
  v_card_mj := gen_random_uuid();
  v_card_sy := gen_random_uuid();
  v_card_dy := gen_random_uuid();
  v_card_tm := gen_random_uuid();

  INSERT INTO public.consultation_cards (
    id, student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status, consulted_at, consultation_note
  ) VALUES
    (v_card_mj, v_stu_mj, v_admin_id, v_today - 35, v_today,
     '함수·그래프 단원에서 유사 오답이 4주 연속 관찰됩니다. 최근 소단원 평가 65점, 숙제 미제출 3회로 학습 루틴 점검이 필요합니다.',
     E'· 6주 점수 추이: 82→65 (하락)\n· 숙제 미제출: 그래프 단원 3회\n· 오답 태그: 함수 오답, 그래프 해석',
     ARRAY['함수 그래프 보강 일정','숙제 체크리스트(학부모 협조)','오답노트 3유형'],
     E'안녕하세요, 김민준 학부모님.\n함수 단원에서 그래프 해석·숙제 루틴 관련 상담을 요청드립니다. 목요일 19시 전화 상담 가능하신지 회신 부탁드립니다.\n— 해성수학전문학원 김원장',
     now() - interval '1 day', 'pending', NULL, NULL),
    (v_card_sy, v_stu_sy, v_admin_id, v_today - 28, v_today,
     '박서연 학생은 88점대에서 62점까지 하락했습니다. 연립방정식·함수 종합에서 조건 해석과 속도 이슈가 있습니다.',
     E'· 점수: 88→62\n· 지각 1회, 숙제 미제출 2회\n· 보강반(중2B) 또는 1:1 검토',
     ARRAY['보강반 편성','숙제 제출 루틴','내신 범위 공유'],
     '서연 학생 보강 일정 안내드립니다. 수요일 보강 가능 여부 알려주세요.',
     now() - interval '4 days', 'completed', now() - interval '3 days', '전화 상담 — 보강반 수요일 확정'),
    (v_card_dy, v_stu_dy, v_admin_id, v_today - 35, v_today,
     '이도윤 학생은 보강 후 52→82로 회복 중입니다. 인수분해·이차함수 숙제 제출률이 개선되었습니다.',
     E'· 보강 2회 후 점수 상승\n· 숙제: missing→complete\n· 다음: 내신 예습',
     ARRAY['회복세 유지','가정 학습 시간','내신 일정'],
     '도윤 학생 회복 흐름 공유드립니다. 다음 주 예습 범위 문자 드리겠습니다.',
     now() - interval '6 days', 'completed', now() - interval '5 days', '대면 상담 완료'),
    (v_card_tm, v_stu_tm, v_admin_id, v_today - 21, v_today,
     '황태민 학생 인수분해 단원 4주 정체. 숙제 미제출 누적으로 상담 권장합니다.',
     E'· 동일 단원 4주\n· 평가 70→61\n· Agent 상담 초안 생성됨',
     ARRAY['인수분해 특강','숙제 관리','학교 시험 일정'],
     '태민 학생 인수분해 보강 상담 요청드립니다.',
     now() - interval '2 days', 'pending', NULL, NULL);

  INSERT INTO public.consultation_cards (
    student_id, generated_by, period_start, period_end,
    learning_summary, evidence_summary, consultation_points, parent_message, created_at,
    consultation_status, consulted_at, consultation_note
  )
  SELECT s.id, v_admin_id, v_today - 14, v_today,
    s.name || ' 학생(' || s.grade || ') — 최근 5주 수업·숙제·점수를 종합한 상담 카드입니다. 상태: ' || s.status || '.',
    E'· 수업 기록 5주\n· Risk Agent 분류 반영\n· 후속: 오답노트·보강',
    ARRAY['학습 습관 점검','단원별 취약 유형','학부모 협조 사항'],
    s.name || ' 학부모님, 해성수학전문학원입니다. 최근 학습 흐름 공유드리며 상담 일정 조율 부탁드립니다.',
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
  INSERT INTO public.parent_reports (student_id, generated_by, period_start, period_end, tone, report_text, created_at)
  VALUES
    (v_stu_mj, v_admin_id, v_today - 14, v_today, 'objective',
     E'[주간 학습 리포트 — 김민준 / 중2A]\n\n안녕하세요, 학부모님. 해성수학전문학원입니다.\n\n이번 2주간 함수·그래프 단원을 진행했으며, 소단원 평가에서 그래프 이동·대칭 유형 오답이 반복되었습니다. 숙제는 3회 미제출로 학원·가정 루틴 점검이 필요합니다.\n\n다음 주: 함수 보강(수) + 오답노트 3유형 제출.\n\n문의: 원장실 02-000-0000 (데모)\n\n— 김원장',
     now() - interval '2 days'),
    (v_stu_sy, v_admin_id, v_today - 14, v_today, 'objective',
     E'[주간 리포트 — 박서연]\n\n점수 추이 88→62로 하락하여 보강반 편성을 권장드립니다. 연립방정식 조건 해석 보충 예정입니다.',
     now() - interval '4 days'),
    (v_stu_dy, v_admin_id, v_today - 14, v_today, 'encouraging',
     E'[주간 리포트 — 이도윤]\n\n보강 후 회복세가 뚜렷합니다(52→82). 숙제 제출률 개선, 다음 주 내신 예습을 함께 진행하겠습니다.',
     now() - interval '5 days'),
    (v_stu_tm, v_admin_id, v_today - 7, v_today, 'friendly',
     E'[주간 리포트 — 황태민]\n\n인수분해 단원에서 학습 정체가 관찰됩니다. 보강 특강 안내 예정이며 상담 일정 회신 부탁드립니다.\n\n[Agent 초안 — 원장 확인 후 발송]',
     now() - interval '1 day');

  INSERT INTO public.parent_reports (student_id, generated_by, period_start, period_end, tone, report_text, created_at)
  SELECT s.id, v_admin_id, v_today - 14, v_today,
    (ARRAY['friendly','objective','encouraging'])[1 + (row_number() OVER (ORDER BY s.name) % 3)],
    format(
      E'[해성수학전문학원 주간 리포트]\n%s 학생 (%s · %s)\n\n이번 기간 수업·숙제·단원 평가를 종합했습니다. 학부모 포털에서 상세 기록을 확인하실 수 있습니다.\n\n담당: 김원장',
      s.name, s.grade, s.school
    ),
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

  -- ── Agent logs (Proactive + Workflow 시연) ──
  INSERT INTO public.agent_logs (academy_id, agent_type, student_id, status, action, result, created_at) VALUES
    (v_academy_id, 'risk_detection', NULL, 'completed', 'proactive_daily_scan',
     jsonb_build_object('processed', 40, 'consultation', 6, 'makeup', 3), now() - interval '8 hours'),
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

  RAISE NOTICE '해성수학전문학원 시드 완료 — 학생 40명, 반 6개. academy_id=%', v_academy_id;
END $$;

COMMIT;
