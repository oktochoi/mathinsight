# EduFlow Signup · Onboarding · Lesson · Schedule & Makeup Redesign

> 설계 문서 — 구현 전 검토용. 승인 후 코드 수정합니다.
> 작성일: 2026-06-29

---

## 1. 현재 회원가입 UX 문제

### 현재 흐름
```
이메일 가입 (/auth 또는 레거시 /signup)
  → 이메일 인증
  → /auth/choose-role
      - 이름 입력
      - 역할 선택 (원장/학부모/학생)
      - 역할 = 원장이면 학원 이름 필수
  → 역할 저장 → /dashboard 바로 이동
```

### 문제점

| # | 문제 | 영향 |
|---|------|------|
| P1 | `choose-role`에서 학원 이름이 **필수** (`role === 'owner' && !academyName` → 에러) | 가입 이탈률 증가 |
| P2 | 역할 선택과 학원 정보 입력이 **한 화면** | 마찰 과도 |
| P3 | 가입 완료 후 **Dashboard 바로** 이동 — 반·시간표·학생 없는 빈 화면 | 사용자 혼란 |
| P4 | 온보딩 없이 Dashboard → "등록된 반이 없습니다" 등 empty state 바로 노출 | 이탈 원인 |
| P5 | 전화번호 수집 단계 없음 | 학원 운영 필수 정보 누락 |

### 코드상 위치
- `app/auth/choose-role/ChooseRoleForm.tsx:40` — `role === 'owner' && !academyName.trim()` 에러
- `app/auth/choose-role/ChooseRoleForm.tsx:63` — `router.replace(postAuthPath(...))` → 바로 `/dashboard`

---

## 2. 온보딩 Wizard 설계

### Route
```
/onboarding
/onboarding?step=1 … step=7
```

`(app)` route group 밖에 별도 레이아웃 (`app/onboarding/layout.tsx`).
사이드바 없음. 상단 Progress Stepper만.

### 상태 저장
- 각 step 완료 시 DB + localStorage 중간 저장
- `academies.onboarding_step` 컬럼 (int, 0~7) — 현재 진행 단계 저장
- 재접속 시 마지막 미완료 step으로 이동
- Dashboard 진입 시 `onboarding_step < 7` → Setup Checklist 배너 표시

### Step 구성

```
Step 1: 학원 기본정보
  필수: 학원명, 대표자명, 전화번호
  선택: 주소, 이메일, 운영 과목, 로고

Step 2: 원장 프로필
  필수: 이름, 휴대전화
  선택: 성별, 생년월일, 프로필 이미지
  (이름은 choose-role에서 이미 받았으면 pre-fill)

Step 3: 운영 설정
  필수/선택 선택형 토글:
    운영 요일 (다중선택 chip), 운영 시간
    출결 사용, 숙제 사용, 성적 사용, 상담 사용
  → academy_settings 테이블 저장

Step 4: 첫 반 생성
  필수: 반 이름, 과목, 학년
  선택: 담당 강사, 정원, 강의실, 메모
  "반 추가" 반복 가능 (최소 1개)

Step 5: 첫 시간표 생성
  반 선택 → 반복 시간표
  필수: 요일, 시작/종료 시간
  선택: 강의실, 강사, 반복 기간

Step 6: 학생 등록  (건너뛰기 허용)
  세 갈래:
  A. 직접 1명 등록 (필수: 이름, 학년, 반)
  B. CSV/Excel 가져오기
  C. 나중에 하기

Step 7: 학부모 연결  (건너뛰기 허용)
  세 갈래:
  A. 새 학부모 등록 (필수: 이름, 전화, 관계)
  B. 초대 링크 생성
  C. 나중에 하기
```

### 컴포넌트 구조
```
app/onboarding/
  layout.tsx           — Stepper, 이전/다음 버튼, 모바일 대응
  page.tsx             — step param 라우팅
  steps/
    Step1Academy.tsx
    Step2Profile.tsx
    Step3Settings.tsx
    Step4Class.tsx
    Step5Schedule.tsx
    Step6Students.tsx
    Step7Parents.tsx
```

### choose-role 변경
- 학원 이름 필드 **제거** (choose-role에서는 역할·이름만)
- 완료 후 → `/onboarding?step=1` (owner) 또는 `/parent` / `/student`

### Dashboard Setup Checklist
`onboarding_step < 7` 이면 Dashboard 상단에 체크리스트 배너:
```
□ 학원 정보 입력    ✓ 반 생성    □ 시간표 생성    □ 학생 등록    □ 학부모 연결
```
각 항목 클릭 → 해당 onboarding step으로 이동.

---

## 3. 오늘 수업 UX 문제

### 현재 구조 문제

| # | 문제 |
|---|------|
| P1 | "일괄 저장" 버튼 — 교육 현장 용어와 맞지 않음. 교사는 "저장"이 아닌 "수업 기록"을 함 |
| P2 | 저장을 눌러야 "수업 마감" 버튼이 보임 → 두 동작의 관계가 불명확 |
| P3 | 수업 미시작(scheduled) 상태에서도 기록 입력 가능 → 수업 전 실수 입력 위험 |
| P4 | 저장 실패 시 피드백 없음 (로딩 스피너만) |
| P5 | 마감 후 수정 제한 없음 — 모든 역할이 마감된 수업을 수정 가능 |
| P6 | 수업 상태(scheduled/in_progress)가 UI 상단에만 표시, 기록 폼과 시각적으로 연결 안 됨 |

### Auto Save 가능성 분석
- 현재 `lesson_logs` 구조: `batchInsert`로 전체 rows를 upsert → auto-save 적합
- `lesson_logs`는 `unique(class_id, student_id, lesson_date)` → row 단위 upsert 가능
- 즉, 출결 변경 즉시 `supabase.from('lesson_logs').upsert({ ... })` 가능

---

## 4. 새로운 수업 상태 Flow

```
scheduled
  → [수업 시작 버튼] → lessons.started_at, started_by 기록
in_progress
  → 기록 자유 입력 + auto-save
  → [수업 마감 버튼] → lessons.closed_at, closed_by 기록
closed
  → 기본 읽기 전용
  → Owner/Admin만 "다시 열기" 버튼으로 in_progress 복귀
```

### 상태별 UI 동작

| 상태 | 기록 폼 | 상단 CTA | 메모 |
|------|---------|----------|------|
| scheduled | disabled + "수업 시작 후 입력 가능" | **수업 시작** (파란 버튼) | — |
| in_progress | 입력 가능 + auto-save | **수업 마감** (빨간 버튼) | 저장 상태 인디케이터 |
| closed | 읽기 전용 | **마감 완료** (회색) + 다시 열기(Owner/Admin) | — |

### 수업 시작 버튼 재도입 이유
이전 세션에서 "수업 시작" 버튼을 제거하고 저장 시 자동 전환했는데,
요구사항에서 "scheduled → 수업 시작 → in_progress" 명시적 흐름을 요구.
→ **수업 시작 버튼 복원**. 저장 시 자동 전환은 제거.

---

## 5. Auto Save (행 단위 저장) 설계

### 저장 방식: 행 단위 즉시 저장
"일괄 저장" 버튼 제거. 각 필드 변경 시 디바운스 후 개별 upsert.

```
출결 버튼 클릭 → 즉시 upsert (lesson_logs)
숙제 버튼 클릭 → 즉시 upsert
점수 입력 → blur 후 500ms 디바운스 upsert
메모 입력 → blur 후 1000ms 디바운스 upsert
```

### 저장 상태 인디케이터
각 학생 카드 우상단에 작은 상태 표시:
```
○  (idle)
⟳  저장 중
✓  저장됨
✗  저장 실패 — 다시 시도
```

### 훅 설계: `useLessonRowSave`
```typescript
function useLessonRowSave(classId, date, studentId, academyId, teacherId) {
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const save = useDebounce(async (field, value) => {
    setSaveState('saving');
    const { error } = await supabase.from('lesson_logs').upsert({...});
    setSaveState(error ? 'error' : 'saved');
    // saved → idle after 2s
  }, debounceMs);
  return { save, saveState };
}
```

---

## 6. 시간표 화면 설계

### 현재 구조
- 탭 2개: 주간 시간표 / 일정 등록
- 주간 캘린더 grid (7열)
- 클릭하면 우측 상세 패널
- 오늘 수업 섹션 (하단)

### 개선 필요사항

| # | 문제 | 개선 |
|---|------|------|
| T1 | 오늘 수업이 주간 캘린더 **하단**에 묻힘 | 상단 고정 섹션으로 이동 |
| T2 | 시간표 카드에서 "오늘 수업 열기" 링크가 없음 | 각 카드에 CTA 추가 |
| T3 | 보강 추가 진입점 없음 | "보강 추가" 버튼 추가 |
| T4 | 강사별 시간표 필터 없음 | 강사 필터 드롭다운 추가 |
| T5 | 수업 상태(scheduled/in_progress/closed)가 캘린더 칩에 미표시 | 칩 색상에 상태 반영 |

### 개선 탭 구조
```
[오늘]  [주간]  [일정 등록]
```

오늘 탭:
- 오늘 수업 목록 (반별 카드)
- 각 카드: 반 이름, 시간, 상태 뱃지(정규/보강), 학생 수, 수업 열기 버튼
- 보강 수업도 함께 표시 (보강 뱃지)

주간 탭:
- 기존 7열 캘린더 유지
- 필터: 전체/반/강사/수업 유형
- 칩에 수업 상태 색상 반영:
  - scheduled: 회색
  - in_progress: 초록
  - closed: 남색

---

## 7. 보강 수업 UX 설계

### 보강 생성 진입점
1. 시간표 > "보강 추가" 버튼
2. 수업 마감 후 "다음 단계" 패널 > "결석자 보강 일정"
3. 학생 상세 > "보강 추가" (개인)

### 보강 생성 모달/페이지
`/schedule/makeup/new` 또는 슬라이드 오버 패널

```
① 보강 날짜·시간 선택
② 대상 학생 선택
   - 전체 학생 목록 (반 필터, 이름 검색)
   - 빠른 필터: [이번 주 결석자] [숙제 미완료] [시험 대비]
   - 체크박스 다중 선택
   - 선택된 학생에 개별 보강 사유 메모 가능
③ 담당 강사 선택
④ 선택사항: 강의실, 관련 반, 보강 사유, 학부모 알림
⑤ 생성
```

### 보강 수업 표시
- 오늘 수업 목록에 함께 표시
- 카드 좌상단에 `보강` 뱃지 (주황색)
- 정규 수업과 동일한 출결/숙제/점수 기록 가능
- 보강 완료 시 원래 결석 기록에 "보강 완료" 표시

---

## 8. 보강 DB 설계

### 현재 `lessons` 테이블 상태
```sql
-- 027 migration 이후:
lessons (
  id, academy_id, class_id, lesson_date, teacher_id, staff_id,
  unit, topic, lesson_memo,
  status CHECK IN ('scheduled', 'in_progress', 'closed', 'canceled'),
  closed_at, closed_by,
  schedule_id, exception_id,
  created_at, updated_at,
  UNIQUE (class_id, lesson_date)  ← 보강은 같은 반·날짜에 여러 개 가능 → 제약 걸림
)
```

### 필요한 변경 (Migration 034)

```sql
-- 1. lessons 테이블 확장
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS started_at    timestamptz,
  ADD COLUMN IF NOT EXISTS started_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_type   text NOT NULL DEFAULT 'regular'
    CHECK (lesson_type IN ('regular', 'makeup', 'special')),
  ADD COLUMN IF NOT EXISTS original_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;

-- 2. UNIQUE 제약 변경: 정규 수업만 (class_id, lesson_date) 유일
-- 현재 UNIQUE (class_id, lesson_date) → 보강 생성 불가 → Partial Unique Index로 교체
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_class_id_lesson_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS lessons_regular_unique_idx
  ON public.lessons (class_id, lesson_date)
  WHERE lesson_type = 'regular';

-- 3. 보강 대상 학생 테이블
CREATE TABLE IF NOT EXISTS public.makeup_lesson_students (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id          uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  makeup_lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id          uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  original_lesson_id  uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  reason              text,  -- 결석 보강, 진도 보충, 시험 대비, 기타
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (makeup_lesson_id, student_id)
);

-- 4. lesson_logs: 보강 여부 플래그
ALTER TABLE public.lesson_logs
  ADD COLUMN IF NOT EXISTS is_makeup boolean NOT NULL DEFAULT false;
```

### 데이터 흐름
```
보강 생성
  → lessons (lesson_type='makeup', original_lesson_id=결석_lesson_id)
  → makeup_lesson_students (학생별 사유)

보강 출결 기록
  → lesson_logs (is_makeup=true, lesson_date=보강일)
  또는
  → attendance_records (lesson_id=makeup_lesson.id)

보강 완료 확인
  → lesson_logs WHERE student_id=X AND lesson_date>=original AND is_makeup=true
  → 학생 상세 "보강 이력" 탭에 표시
```

### 중복 저장 회피
`lesson_logs`를 auto-save의 1차 저장소로 유지 (현재 구조 유지).
`attendance_records`·`lesson_scores`(024)는 미래 정규화 레이어로만 유지.
→ 두 테이블에 동시 기록하지 않음. `lesson_logs.lesson_id FK`로만 연결.

---

## 9. 권한별 동작 설계

| 동작 | Owner/Admin | Teacher | Desk |
|------|-------------|---------|------|
| 수업 시작 | ✅ | ✅ (담당 반) | ❌ |
| 기록 입력 (auto-save) | ✅ | ✅ (담당 반) | ❌ |
| 수업 마감 | ✅ | ✅ (담당 반) | ❌ |
| 마감 후 다시 열기 | ✅ | ❌ | ❌ |
| 보강 추가 | ✅ | ⚙️ (설정 필요) | ⚙️ |
| 보강 수정/삭제 | ✅ | ⚙️ | ❌ |
| 시간표 수정 | ✅ | ⚙️ | ❌ |
| 시간표 조회 | ✅ | ✅ | ✅ |

`⚙️` = `staff_permission_overrides`로 개별 부여 가능.

Permission Key 추가 필요:
```
lessons.reopen      수업 다시 열기
lessons.makeup      보강 추가
schedule.manage     시간표 수정
```

---

## 10. 필요한 Migration 목록

| # | 파일 | 내용 |
|---|------|------|
| 034 | `034_lesson_makeup_redesign.sql` | lessons 확장(started_at/by, lesson_type, original_lesson_id), UNIQUE 재설계, makeup_lesson_students 테이블, lesson_logs.is_makeup |
| 035 | `035_onboarding_step.sql` | `academies.onboarding_step int DEFAULT 0`, `academies.phone text`, `users.phone text` |

---

## 11. 영향받는 파일 목록

### 신규 생성
```
app/onboarding/layout.tsx
app/onboarding/page.tsx
app/onboarding/steps/Step1Academy.tsx
app/onboarding/steps/Step2Profile.tsx
app/onboarding/steps/Step3Settings.tsx
app/onboarding/steps/Step4Class.tsx
app/onboarding/steps/Step5Schedule.tsx
app/onboarding/steps/Step6Students.tsx
app/onboarding/steps/Step7Parents.tsx
components/lesson/LessonRowCard.tsx          (학생별 카드 + auto-save 인디케이터)
hooks/useLessonRowSave.ts                    (행 단위 auto-save 훅)
hooks/useMakeupLessons.ts                    (보강 CRUD)
components/schedule/MakeupLessonModal.tsx    (보강 생성 모달)
```

### 수정
```
app/auth/choose-role/ChooseRoleForm.tsx      학원 이름 필드 제거, /onboarding 리다이렉트
app/(app)/lesson-logs/PageClient.tsx         수업 시작 버튼 복원, auto-save, 상태별 잠금
app/(app)/schedule/PageClient.tsx            오늘 탭 추가, 보강 추가 버튼
app/(app)/dashboard/DashboardClient.tsx      Setup Checklist 배너 추가
lib/permissions.ts                           lessons.reopen, lessons.makeup, schedule.manage 추가
lib/staffNavigation.ts                        (변경 없음)
types/database.ts                            lessons 타입 확장
```

---

## 12. 구현 우선순위

| 순위 | 항목 | 이유 |
|------|------|------|
| P0 | choose-role 학원 이름 제거 + `/onboarding` 리다이렉트 | 가입 이탈 즉시 개선 |
| P1 | 온보딩 Wizard Step 1~4 (학원·반·시간표 기본) | 신규 원장이 쓸 수 있는 최소 경로 |
| P2 | Migration 034 (lessons 확장) | 수업 Flow·보강 구현의 기반 |
| P3 | 오늘 수업: 수업 시작 버튼 + 상태별 잠금 | 현장 피드백 반영 |
| P4 | Auto Save (행 단위) | "일괄 저장" 제거 가능 |
| P5 | 보강 추가 모달 + 오늘 수업 보강 표시 | 보강 기능 MVP |
| P6 | 온보딩 Step 5~7 (학생·학부모) | 완성도 |
| P7 | 시간표 오늘 탭 + 강사 필터 | UX 개선 |
| P8 | Setup Checklist Dashboard 배너 | 온보딩 완결 |

---

## 13. 위험 요소

### R1 — `lessons` UNIQUE 제약 변경
현재 `UNIQUE(class_id, lesson_date)` — `DROP CONSTRAINT` 후 Partial Index로 교체.
기존 데이터에서 같은 반·날짜에 중복 rows가 없어야 함 (있으면 마이그레이션 실패).
→ 마이그레이션 전 `SELECT class_id, lesson_date, count(*) FROM lessons GROUP BY 1,2 HAVING count(*)>1` 확인 필요.

### R2 — Auto Save와 수업 상태 동기화
`in_progress` 아닌 상태에서 auto-save가 실행되면 안 됨.
→ 훅에서 `lesson.status !== 'in_progress'` 이면 upsert 차단.

### R3 — 온보딩 미완료 원장 처리
기존 유저(이미 dashboard 사용 중)는 `onboarding_step = 0` → Setup Checklist 배너가 뜨면 혼란.
→ 기존 원장은 `onboarding_step = 7`로 백필 필요. Migration 035에서 처리.

### R4 — choose-role 학원 이름 제거 → 기존 Google OAuth 유저
Google OAuth로 가입한 유저가 학원 이름 없이 owner로 등록될 수 있음.
→ `handle_new_user` 트리거 함수에서 `academy_name IS NULL`이면 임시 학원명(`{name}의 학원`)으로 생성하거나 onboarding으로 유도. 설계 결정 필요.

### R5 — 보강과 lesson_logs 연결
`lesson_logs`에 `is_makeup` 컬럼 추가 후, 기존 row들은 `is_makeup = false` (DEFAULT 적용으로 자동).
보강 lesson_logs는 `class_id` 없이 `is_makeup = true`로 저장 — 기존 쿼리가 `class_id` 필터링하므로 영향 없음.

---

## 14. 최종 권장안

### 즉시 구현 (이번 스프린트)
1. **choose-role 학원 이름 제거** → 완료 후 `/onboarding`으로 이동
2. **온보딩 Step 1~4** (학원 기본 + 반 + 시간표) — Step 5~7은 건너뛰기 가능
3. **Migration 034** (lessons 확장, makeup_lesson_students)

### 수업 Flow 재설계
- "일괄 저장" → 제거
- "수업 시작" 버튼 → scheduled에서만 표시
- Auto Save → `in_progress` 상태에서만 동작
- "수업 마감" → 별도 확정 액션

### 보강
- MVP: 보강 수업 생성 + 학생 선택 + 출결 기록
- 오늘 수업 목록에 "보강" 뱃지로 구분
- 원래 결석 수업과 FK 연결 (`original_lesson_id`)

### 인식 전환
> 오늘 수업 화면 = 저장 화면이 아님.
> 수업을 **시작하고 → 기록하고 → 마감하는** 운영 콘솔.

---

*상태: 초안 | 다음 단계: 검토 후 P0부터 순서대로 구현 시작*
