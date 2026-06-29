# EduFlow Role & Permission System Design

> 설계 문서 — 구현 전 검토용. 이 문서가 승인된 후에 코드를 작성합니다.

---

## 1. 현재 권한 구조 분석

### DB 레이어

| 컬럼 | 위치 | 현재 값 |
|------|------|---------|
| `users.role` | `public.users` | `'admin' \| 'teacher' \| 'parent' \| 'student'` |
| `staff_profiles.permissions` | `public.staff_profiles` | `jsonb` 컬럼 존재하나 **UI에서 전혀 사용 안 함** |

`admin`은 DB 레거시 네이밍. 앱 코드에서는 `fromDbRole('admin') → 'owner'`로 변환.

### 앱 레이어 (`lib/roles.ts`)

```
UserRole = 'owner' | 'teacher' | 'parent' | 'student'
```

- `owner` = 원장 (DB: admin)
- `teacher` = 강사 (DB: teacher)
- `parent` / `student` = 비스탭

### 인증 레이어 (`lib/authRedirectPolicy.ts`)

```
staffPrefixes = ['/dashboard', '/students', '/lesson-logs', '/counseling', …]
```

역할 두 갈래만 구분: **스탭(owner|teacher)** vs **학부모** vs **학생**

### 현재 존재하는 역할 수 = 4개

`owner`, `teacher`, `parent`, `student`

---

## 2. 현재 문제점

### P1 — 역할 부재: 원무직원(Desk) 없음

학원 프론트/원무 담당자는 강사가 아니지만 학생·학부모 관리는 해야 한다.
현재는 `teacher`로 넣거나 `owner`로 넣는 수밖에 없음 → **과도한 권한 부여**.

### P2 — 권한 부재: Admin(부원장) 개념 없음

원장이 여럿인 학원(체인) 또는 부원장을 두는 학원에서 `teacher`로 등록하면
수업 기록 외 메뉴를 못 쓰고, `owner`로 올리면 설정까지 건드릴 수 있음.

### P3 — Teacher Scope 없음

강사 A가 담당하지 않는 반·학생 정보를 모두 볼 수 있음.
개인정보 보호 및 학원 내 경쟁 이슈.

### P4 — `staff_profiles.permissions` 사용 안 함

jsonb 컬럼이 있지만 코드 어디에도 읽지 않음. 사실상 데드 컬럼.

### P5 — Navigation/Route 분리 없음

현재 `staffPrefixes` 배열로 스탭/비스탭만 나눔.
강사가 `/billing`, `/analytics`, `/settings`에 접근할 수 있는 것은 의도된 것인가? 불명확.

### P6 — analytics/dashboard 중복

`/analytics/page.tsx`가 `redirect('/dashboard')` 한 줄. 사이드바에 "업무판"과 "분석" 두 메뉴가 보이지만 같은 페이지. 운영 메뉴에서 "분석"이 별도 존재해야 할 이유가 없는 상태.

---

## 3. 역할별 기본 권한표

> ✅ = 기본 허용 | ⚙️ = 커스터마이징 가능 | ❌ = 불가 | 🔒 = Scope 내만

| 기능 영역 | Owner | Admin | Teacher | Desk | Parent | Student |
|-----------|-------|-------|---------|------|--------|---------|
| 업무판(Dashboard) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 학생 목록 조회 | ✅ | ✅ | 🔒 | ✅ | ❌ | ❌ |
| 학생 등록/수정 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| 학생 퇴원 처리 | ✅ | ✅ | ❌ | ⚙️ | ❌ | ❌ |
| 수업 기록 | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| 상담 카드 | ✅ | ✅ | 🔒 | ⚙️ | ❌ | ❌ |
| 재등록 관리 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| 학부모 소통 | ✅ | ✅ | 🔒 | ✅ | ❌ | ❌ |
| 분석 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 수강료/수납 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| 설정(학원 정보) | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| 설정(직원 관리) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 설정(권한 관리) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 학부모 포털 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 학생 포털 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> 🔒 = Teacher Scope 적용 (자신이 담당한 반/학생만)
> ⚙️ = Owner가 활성화/비활성화 가능한 선택적 권한

---

## 4. Permission Key 목록

스탭 전용 Permission Key. 부모·학생에는 적용 안 함.

```
# 학생
students.view          학생 목록 조회
students.create        학생 등록
students.edit          학생 정보 수정
students.withdraw      퇴원 처리

# 수업
lessons.view           수업 기록 조회
lessons.manage         수업 기록 등록/수정/마감

# 상담
counseling.view        상담 카드 조회
counseling.manage      상담 카드 생성/수정

# 재등록
retention.view         재등록 현황 조회
retention.manage       재등록 처리

# 학부모 소통
parent_comms.view      학부모 소통 조회
parent_comms.send      메시지/리포트 발송

# 수강료
billing.view           수납 현황 조회
billing.manage         수납 등록/수정

# 분석
analytics.view         분석 리포트 조회

# 설정
settings.academy       학원 정보 수정
settings.staff         직원 등록/수정/삭제
settings.permissions   권한 설정

# Teacher Scope
scope.all_students     전체 학생 접근 (없으면 담당 반만)
```

총 20개 Permission Key.

---

## 5. 권한 설정 화면 IA

라우트: `/settings?tab=permissions`  (기존 설정 탭 내부로)

```
설정
└── 권한 관리 탭  (Owner 전용, Admin 진입 불가)
    ├── 역할별 기본 권한표  (읽기 전용 참조 테이블)
    └── 직원별 권한 커스터마이징
        ├── 직원 목록 (이름, 역할, 마지막 접속)
        └── [직원 선택] → 권한 편집 패널
            ├── 역할 변경 (owner / admin / teacher / desk)
            ├── 추가 권한 체크박스 (⚙️ 항목만)
            ├── Teacher Scope 설정
            │   ├── "전체 학생" 토글
            │   └── 담당 반 멀티셀렉트 (전체 아닐 때)
            └── 저장
```

> `/settings/permissions` 별도 라우트가 아니라 기존 `/settings` 탭으로 통합
> → 사이드바 항목 추가 없이 설정 안에서 처리

---

## 6. Navigation 적용 방식

`staffNavigation.ts` STAFF_NAV_GROUPS에 `requiredPermissions?: string[]` 필드 추가.

```typescript
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  hidden?: boolean;
  requiredPermissions?: string[];   // 추가
};
```

예시:

```typescript
{ label: '분석', href: '/analytics', icon: 'ri-bar-chart-2-line',
  requiredPermissions: ['analytics.view'] },
{ label: '수강료', href: '/billing', icon: 'ri-wallet-3-line',
  requiredPermissions: ['billing.view'] },
```

`Sidebar.tsx`에서 필터링:

```typescript
const visibleItems = items.filter(item =>
  !item.requiredPermissions ||
  item.requiredPermissions.every(p => staffCan(p))
);
```

`staffCan(key)` = 현재 로그인 스탭의 permission 배열에 key가 있는지 체크.

### analytics/dashboard 중복 해결 방안

현재: `/analytics` = `redirect('/dashboard')` → 내비에서 두 항목이 같은 곳으로 감.

**권장: "분석" 메뉴를 실제 분석 페이지로 구현하거나, 구현 전까지 내비에서 제거.**

단기 픽스 (구현 전): `STAFF_NAV_GROUPS`에서 `분석` 항목 `hidden: true` 처리.
장기: `/analytics` 페이지를 학원 운영 지표(월별 수강생 추이, 출석률, 매출 그래프)로 만든 후 복원.

---

## 7. Route Guard 적용 방식

현재 `authRedirectPolicy.ts`는 prefix 배열만 비교.

### 변경 후

```typescript
// authRedirectPolicy.ts에 permission-level guard 추가
export type RouteRule = {
  prefix: string;
  requiredRole?: UserRole[];          // 역할 레벨
  requiredPermission?: string;       // permission key 레벨
};

export const STAFF_ROUTE_RULES: RouteRule[] = [
  { prefix: '/analytics',       requiredPermission: 'analytics.view' },
  { prefix: '/billing',         requiredPermission: 'billing.view' },
  { prefix: '/settings',        requiredPermission: 'settings.academy' },
  { prefix: '/lesson-logs',     requiredPermission: 'lessons.view' },
  // ...
];
```

미들웨어 또는 레이아웃에서 체크:
```
권한 없음 → redirect('/dashboard?error=no_permission')
```

### Server Component 레이아웃 패턴

`app/(app)/analytics/layout.tsx`:
```typescript
import { requirePermission } from '@/lib/serverAuth';
export default async function Layout({ children }) {
  await requirePermission('analytics.view');  // 없으면 redirect
  return children;
}
```

---

## 8. API Guard 적용 방식

Next.js Route Handler (`app/api/...`) 레이어.

현재 API는 대부분 클라이언트에서 supabase SDK 직접 호출 → 별도 API Route 없음.
→ **RLS로 충분히 커버 가능**. 서버 액션 있는 경우에만 아래 패턴 적용.

```typescript
// lib/serverAuth.ts (신규)
export async function requirePermission(key: string) {
  const { profile } = await getServerSession();
  if (!hasPermission(profile, key)) {
    redirect('/dashboard?error=no_permission');
  }
}
```

---

## 9. RLS 적용 방식

현재 RLS는 `users.role`만 체크. Permission key는 RLS에 직접 적용하기 복잡하므로 **역할 레벨로만** RLS를 유지.

### Teacher Scope RLS (핵심)

강사가 자신이 담당한 반의 학생만 볼 수 있게:

```sql
-- staff_class_assignments 테이블 (신규)
-- staff_profile_id, class_id 관계 테이블

-- students 테이블 SELECT 정책 예시
CREATE POLICY "teacher_sees_own_classes" ON students
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT sp.user_id FROM staff_profiles sp
      JOIN staff_class_assignments sca ON sca.staff_profile_id = sp.id
      WHERE sca.class_id = students.class_id
    )
    OR (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('admin')  -- owner/admin은 전체
  );
```

> **주의**: RLS 정책이 복잡해질수록 쿼리 성능에 영향. EXPLAIN ANALYZE로 검증 필요.

---

## 10. Teacher Scope 설계

강사 A가 "고1 B반" 담당이면 → B반 학생만 lesson-logs, 상담, 학부모 소통에서 조회 가능.

### 데이터 모델

```
staff_class_assignments
  id             uuid PK
  staff_id       uuid → staff_profiles.id
  class_id       uuid → classes.id
  academy_id     uuid → academies.id
  assigned_at    timestamp
```

### UI 적용

1. **학생 목록**: `scope.all_students` 없는 Teacher는 자신의 class_id 목록으로 필터
2. **수업 기록**: 반 선택 드롭다운에 담당 반만 표시
3. **상담 카드**: 담당 학생의 카드만 기본 표시 (필터 기본값)
4. **학부모 소통**: 담당 학생의 학부모만 메시지 대상으로 표시

### 훅 레이어 변경

```typescript
// useStudents.ts
const { isTeacher, assignedClassIds } = useStaffScope();

// fetch 시 조건 추가
if (isTeacher && !can('scope.all_students')) {
  query = query.in('class_id', assignedClassIds);
}
```

---

## 11. DB 변경 필요사항

### 신규 테이블

```sql
-- (A) 역할 확장: teacher/owner/admin/desk
-- users.role 컬럼 타입 변경 또는 staff_profiles.staff_role 추가

-- (B) 직원별 Permission Overrides
CREATE TABLE staff_permission_overrides (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id        uuid REFERENCES staff_profiles(id) ON DELETE CASCADE,
  academy_id      uuid REFERENCES academies(id) ON DELETE CASCADE,
  permission_key  text NOT NULL,
  granted         boolean NOT NULL DEFAULT true,
  created_at      timestamp DEFAULT now()
);
-- unique (staff_id, permission_key)

-- (C) Teacher Scope: 담당 반 배정
CREATE TABLE staff_class_assignments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id    uuid REFERENCES staff_profiles(id) ON DELETE CASCADE,
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE,
  academy_id  uuid REFERENCES academies(id) ON DELETE CASCADE,
  UNIQUE (staff_id, class_id)
);
```

### 기존 컬럼 변경

```sql
-- users.role: 'admin' | 'teacher' | 'parent' | 'student' → desk 추가
ALTER TYPE user_role ADD VALUE 'desk';
-- 또는 role을 text로 유지하고 앱 레이어에서 validate

-- staff_profiles.permissions: 이 컬럼을 제거하고 staff_permission_overrides로 마이그레이션
```

### 기존 데이터 영향

- `users.role = 'admin'` 인 기존 유저 → 변경 없음 (owner로 매핑 유지)
- `staff_profiles.permissions` 값이 있는 경우 → override 테이블로 마이그레이션 스크립트 필요

---

## 12. Migration Plan

### Phase 0 (즉시, 코드만)

- `staffNavigation.ts`: `분석` 항목 `hidden: true` 처리 (analytics 중복 해결)
- 현재 analytics/page.tsx 는 그대로 (redirect 유지)

### Phase 1 (1주) — Desk 역할 추가

```
031_add_desk_role.sql
  - users.role에 'desk' 값 추가
  - lib/roles.ts: UserRole에 'desk' | 'admin' 추가, fromDbRole 업데이트
  - authRedirectPolicy.ts: desk는 staff prefix 접근 허용
  - staffPrefixes에서 /billing, /analytics 제외 (Desk 접근 가능, Teacher 불가)
```

### Phase 2 (1-2주) — Permission Override 테이블

```
032_staff_permission_overrides.sql
  - staff_permission_overrides 테이블 생성
  - RLS 정책 추가

lib/permissions.ts (신규)
  - DEFAULT_PERMISSIONS: Record<StaffRole, string[]>
  - hasPermission(profile, key): boolean
  - useStaffPermissions() 훅

settings/PermissionsTab.tsx (신규)
  - 직원 목록 + 권한 편집 패널
```

### Phase 3 (2-3주) — Teacher Scope

```
033_staff_class_assignments.sql
  - staff_class_assignments 테이블 생성
  - RLS 정책: teacher는 자신의 class_id 학생만 SELECT

useStaffScope() 훅 (신규)
  - assignedClassIds 반환
  - isTeacher boolean

useStudents.ts, useLessonLogs.ts 업데이트
  - scope 적용 쿼리 필터

설정 > 직원 관리: 담당 반 배정 UI
```

### Phase 4 (3-4주) — Navigation/Route Guard

```
Sidebar.tsx: requiredPermissions 필터링 적용
authRedirectPolicy.ts: permission-level route guard 추가
레이아웃별 requirePermission() 서버사이드 가드
```

---

## 13. 구현 우선순위

| 우선순위 | 항목 | 이유 |
|----------|------|------|
| P0 | analytics 내비 중복 제거 | 즉시 수정, 1줄 변경 |
| P1 | Desk 역할 추가 | 현재 원무 담당자가 teacher/owner 남용 중 |
| P2 | 기본 Permission Key 정의 + hasPermission 훅 | 이후 모든 구현의 기반 |
| P3 | Navigation 권한 필터링 | UX 개선, 구현 비용 낮음 |
| P4 | Teacher Scope (DB + 훅) | 개인정보 보호 핵심 |
| P5 | 권한 설정 화면 | Owner가 UI에서 설정 가능하게 |
| P6 | Route Guard 강화 | 보안 하드닝 |
| P7 | RLS Teacher Scope 정책 | DB 레벨 완전 격리 |

---

## 14. 구현 전 위험 요소

### R1 — 기존 teacher 계정 Scope 적용 시 데이터 단절

Phase 3 배포 후 기존 강사들이 `staff_class_assignments`에 배정 없으면 학생이 0명으로 보임.
→ **마이그레이션 필요**: 기존 강사에게 `scope.all_students` 권한 부여 or 전체 반 자동 배정.

### R2 — users.role 'desk' 추가 → DB Enum 변경

PostgreSQL enum에 값 추가는 DDL이고 롤백 불가.
→ text 타입 유지하는 방식 검토 (현재도 role은 text 타입인지 확인 필요).

### R3 — RLS 복잡도 증가 → 성능 저하

JOIN이 들어간 RLS 정책은 row 단위로 평가. 학생 수가 많은 학원에서 느려질 수 있음.
→ Phase 3 전에 EXPLAIN ANALYZE로 벤치마크.

### R4 — staff_profiles.permissions 기존 데이터

어떤 값이 들어있는지 확인 안 됨. 마이그레이션 전 `SELECT permissions FROM staff_profiles WHERE permissions IS NOT NULL` 실행해 확인.

### R5 — Owner가 자기 자신의 권한을 제거할 경우

Owner가 실수로 `settings.permissions` 권한을 자신에게서 제거하면 권한 설정 화면 진입 불가.
→ Owner는 permission override 적용 안 함 (항상 full access) 규칙 필요.

---

## 15. 최종 권장안

### 단기 (이번 스프린트, 코드 3개 파일 변경)

1. **analytics 중복 즉시 제거**: `staffNavigation.ts`에서 `분석` 항목 `hidden: true` → 사이드바에서 사라짐. 실제 분석 페이지 구현 준비될 때 복원.

2. **Desk 역할 추가 (Phase 1)**: `lib/roles.ts`에 `'desk'` 추가, 라우트 가드 업데이트. DB migration 031. 낮은 리스크, 즉시 유용.

### 중기 (다음 스프린트)

3. **`lib/permissions.ts` + `DEFAULT_PERMISSIONS`**: 역할별 기본 권한 배열 정의, `hasPermission()` 유틸 구현.

4. **Navigation 권한 필터링**: Sidebar.tsx에서 `requiredPermissions` 체크. DB 없이 순수 코드.

### 장기 (안정화 후)

5. **Teacher Scope + 권한 설정 화면**: DB 마이그레이션 포함, 가장 리스크 높음. 기존 사용자 데이터 주의.

---

### analytics 문제 결론

> `/analytics`는 지금 당장은 사이드바에서 숨겨야 합니다.
> 실제 분석 페이지(월별 수강생 추이, 출석률 차트, 매출 그래프)를 만들기 전까지는
> 두 메뉴가 같은 페이지를 가리키는 것이 더 나쁜 UX입니다.
> 분석 페이지 구현은 `/billing` 구현과 같이 "운영 리포트" 스프린트에서 다루는 것을 권장합니다.

---

*작성일: 2026-06-29 | 상태: 초안 | 다음 단계: 리뷰 후 Phase 0–1 구현 승인*
