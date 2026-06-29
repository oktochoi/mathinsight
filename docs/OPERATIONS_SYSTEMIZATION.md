# EduFlow 운영 시스템화 — 실행 계획

## Phase 0. 마이그레이션 검증

**상태: 023~027 적용 완료** — 검증은 `scripts/verify-erp-migrations.sql` 실행

### 적용 순서 (참고)
`023_erp_data_phase_a.sql` → `024` → `025` → `026` → `027_lesson_operational_status.sql`

### 백필 검증 쿼리 (Supabase SQL Editor)

```sql
-- 테이블 존재·건수
select 'staff_profiles' as t, count(*) from staff_profiles
union all select 'lessons', count(*) from lessons
union all select 'parents', count(*) from parents
union all select 'student_risk_snapshots', count(*) from student_risk_snapshots
union all select 'reregistration_records', count(*) from reregistration_records;

-- lesson_logs ↔ lessons 연결율
select
  count(*) as logs,
  count(lesson_id) as linked,
  round(100.0 * count(lesson_id) / nullif(count(*),0), 1) as pct
from lesson_logs;

-- 강사 담당 학생 뷰
select count(*) from v_teacher_students;
```

### 앱 테이블 사용 현황 (구현 전)

| 영역 | 현재 | 목표 |
|------|------|------|
| 수업 읽기 | `lesson_logs` | `lessons` + `attendance_records` + `lesson_scores` (폴백: logs) |
| 출결/숙제/성적 화면 | `lesson_logs` 직접 upsert | **읽기**: `loadClassDayData` / `loadClassScorePoints` (lessons 폴백) · **쓰기**: logs→트리거 |
| 상담센터 | cards만 | snapshots 대상 + `counselor_id`/`parent_id` on create + 재등록 complete 연동 |
| 재등록 | `retention_signals` | `student_risk_snapshots` + `reregistration_records` |
| 보호자 | `parent_user_id`, `student_connections` | `parents` + `parent_student_links` |
| 대시보드 | academy 전체 | owner: 전체 / teacher: `v_teacher_students` |

---

## 1. lesson_logs 의존 파일

- `hooks/useLessonLogs.ts` — 읽기·쓰기
- `hooks/useDashboardStats.ts`
- `hooks/usePortalErp.ts`, `hooks/useStudents.ts`, `hooks/useClasses.ts`
- `app/(app)/attendance/page.tsx`, `homework/page.tsx`, `lesson-logs/page.tsx`
- `app/(app)/students/page.tsx`, `students/[id]/StudentDetail.tsx`
- `lib/lessonLogUpsert.ts`, `lib/agents/*`, `lib/rag/*`, `app/api/retention/scan`

## 2. ERP 테이블 사용 가능 여부

마이그레이션 적용 후 사용. 미적용 시 훅이 `lesson_logs` / `retention_signals`로 폴백.

## 3. Role별 Dashboard

- **owner/admin**: `DashboardActionBoard` — 상담·재등록·문의·미마감 수업
- **teacher**: `TeacherActionBoard` — 오늘 내 수업·마감 필요·담당 학생 신호·내 상담

## 4. 오늘 수업 대표 흐름

`/lesson-logs?class=&date=` → 반·날짜 선택 → 출결·숙제·점수·메모 일괄 저장 → `lesson_logs` upsert → 트리거가 `lessons` 동기화 → 수업 마감(`closed`)

## 5. 학생 상세 데이터 소스

`useStudentHub(studentId)` → enrollments, parents, snapshots, reregistration, 담당 강사

## 6. 상담센터 흐름

`student_risk_snapshots` → 상담 대상 → `consultation_cards` → `counseling_sessions` → `parent_reports` / 메시지 초안 → `reregistration_records`

## 7. 보호자 전환

`useStudentParents` — `parents` + `parent_student_links`, `parent_user_id` 폴백

## 8. 재등록 루프

`useRetention` — snapshots(type=retention) + `reregistration_records`, legacy `retention_signals` 폴백

## 9. 수정 파일 목록

- `types/database.ts`
- `hooks/useStaffScope.ts`, `useStudentHub.ts`, `useTodayLesson.ts`
- `hooks/useLessonLogs.ts`, `useDashboardStats.ts`, `useRetention.ts`
- `components/dashboard/TeacherActionBoard.tsx`
- `app/(app)/dashboard/DashboardClient.tsx`
- `app/(app)/lesson-logs/page.tsx`
- `app/(app)/students/[id]/StudentDetail.tsx`
- `app/(app)/retention/page.tsx`
- `supabase/migrations/027_*`
- `README.md`

## 10. 위험 이슈

- 마이그레이션 미적용 시 ERP 테이블 쿼리 실패 → 폴백 필수
- `held` vs `closed` 상태 — 027에서 통합
- teacher RLS는 아직 academy 전체 — 앱 레벨 스코프로 1차 차단
- 이중 진실: logs와 lessons 불일치 시 트리거 재동기화 필요
