# EduFlow User Model & Academy Relationship Architecture

> 작성일: 2026-06-29  
> 목적: 현재 구조 분석 → 추천 아키텍처 설계  
> 상태: 설계 문서 (코드 변경 없음)

---

## 목차

1. [현재 구조 분석](#1-현재-구조-분석)
2. [현재 구조의 문제점](#2-현재-구조의-문제점)
3. [추천 User Model](#3-추천-user-model)
4. [추천 Academy 구조](#4-추천-academy-구조)
5. [추천 Entity Relationship Diagram](#5-추천-entity-relationship-diagram)
6. [추천 회원가입 Flow](#6-추천-회원가입-flow)
7. [추천 Onboarding Flow](#7-추천-onboarding-flow)
8. [추천 Teacher 구조](#8-추천-teacher-구조)
9. [추천 Parent 구조](#9-추천-parent-구조)
10. [추천 Student 구조](#10-추천-student-구조)
11. [추천 RLS 구조](#11-추천-rls-구조)
12. [추천 DB 변경사항](#12-추천-db-변경사항)
13. [Migration Plan](#13-migration-plan)
14. [구현 우선순위](#14-구현-우선순위)
15. [장기 확장성 평가](#15-장기-확장성-평가)

---

## 1. 현재 구조 분析

### 1.1 Auth & Identity Layer

```
auth.users (Supabase managed)
  └─ raw_user_meta_data: { name, role, profile_setup, academy_name }
       ↓ trigger: handle_new_user()
public.users
  id, email, name, role (admin|teacher|desk|parent|student)
  academy_id (단일 FK → academies)
  phone, gender, birthdate, avatar_url
  onboarding_complete boolean
```

**현황:** `users`는 Auth identity와 Role을 동시에 담당한다. 한 사람은 하나의 역할만 가질 수 있다.

---

### 1.2 Staff Layer

```
users (role = admin|teacher|desk)
  └─ staff_profiles
       id, user_id (1:1), academy_id
       employment_status, phone, hire_date, permissions{}
       └─ class_teachers (M:N)
            class_id, staff_id, role (homeroom|assistant|substitute)
            └─ classes
                 id, academy_id, teacher_id (legacy FK)
                 name, grade, subject
```

**현황:**
- `staff_profiles`는 `users`에서 role=admin/teacher일 때 트리거로 자동 생성
- `classes.teacher_id`는 레거시 FK. 실제 다중 교사 배정은 `class_teachers`로 이동 중
- 두 개의 교사 참조 경로가 병존 (classes.teacher_id vs class_teachers)

---

### 1.3 Student Layer

```
students (CRM record — Auth와 독립적으로 존재 가능)
  id, academy_id, class_id (legacy single FK)
  name, grade, school, status, enrollment_status
  student_code, connection_code (legacy)
  parent_user_id (legacy), student_user_id (legacy)  ← DEPRECATED
  └─ student_enrollments (배치 이력)
       id, academy_id, student_id, class_id, term_id
       status (active|ended|transferred)
```

**현황:**
- Student는 Auth 계정 없이 학원이 직접 생성하는 CRM 레코드
- `students.class_id` + `student_enrollments` 이중 배치 관리
- 레거시 portal 링크 필드(`parent_user_id`, `student_user_id`)가 아직 존재

---

### 1.4 Portal Access Layer (User ↔ Student 연결)

```
student_connection_requests (pending)
  academy_id, student_id (nullable), user_id
  relationship, requested_student_name
  status (pending|approved|rejected)
    ↓ RPC: review_student_connection_request()
student_connections (approved)
  student_id, user_id
  relationship (mother|father|guardian|student)
    ↓ trigger: sync_parent_from_connection()
parents (CRM entity)
  id, academy_id, user_id (nullable)
  name, phone, email
    └─ parent_student_links (M:N)
         parent_id, student_id, relationship
         is_primary, is_emergency_contact
```

**현황:**
- `student_connections` = Auth user의 학생 접근 권한 (RLS 기준)
- `parents` = CRM 연락처 레코드 (user가 없어도 존재 가능)
- `parent_student_links` = CRM 관계 레코드
- 세 개의 테이블이 유사한 관계를 중복 표현

---

### 1.5 Lesson & Operational Layer

```
lesson_logs (레거시 입력 단위, 여전히 주 write 경로)
  student_id, class_id, lesson_date
  attendance_status, homework_status, test_score
    ↓ trigger: sync_lesson_log_to_normalized()
    ├─ lessons (수업 단위)
    │    id, academy_id, class_id, lesson_date (UNIQUE per class)
    │    status, teacher_id
    ├─ attendance_records
    │    lesson_id, student_id, status (present|late|absent)
    └─ lesson_scores
         lesson_id, student_id, score
```

**현황:**
- `lesson_logs`가 write 진입점이고 trigger가 정규화된 테이블에 동기화
- 실제 데이터 원본이 어느 테이블인지 불명확
- 트리거 기반 동기화는 복잡하고 버그 유발 가능성 높음

---

### 1.6 현재 아키텍처 요약 다이어그램

```
auth.users
    │ trigger
    ▼
users ──────────── academies
 │ role                │
 ├─ admin/teacher  ─── classes ─── class_teachers ─── staff_profiles
 ├─ parent         ─── parents ─── parent_student_links
 └─ student                              │
                                     students ──── student_enrollments
                                         │
                          student_connections (auth bridge)
                                         │
                                  lesson_logs ──► lessons
                                                    ├── attendance_records
                                                    └── lesson_scores
```

---

## 2. 현재 구조의 문제점

### P0: 레거시 중복 — 즉시 해결 필요

**문제 1: Students 레거시 portal 필드**
```sql
students.parent_user_id   -- DEPRECATED
students.student_user_id  -- DEPRECATED
students.connection_code  -- DEPRECATED (student_code로 이동 중)
```
→ `student_connections`가 이미 동일 역할을 담당  
→ 두 경로가 병존하면 RLS 로직이 이중화되고 데이터 불일치 발생 가능

**문제 2: classes.teacher_id vs class_teachers 이중 교사 참조**
```sql
classes.teacher_id         -- 레거시 단일 FK
class_teachers.staff_id    -- 다중 배정 지원
```
→ 어떤 교사가 "담당"인지 조회 경로가 두 개  
→ 트리거가 두 테이블을 동기화하지만 race condition 가능성

**문제 3: lesson_logs write 의존성**
→ UI가 여전히 `lesson_logs`에 직접 쓰고 trigger로 정규화  
→ 정규화된 `lessons` 테이블의 필드(`unit`, `topic`, `started_at` 등)를 lesson_logs에서 채울 수 없음  
→ lesson 수준 데이터(수업 메모, 상태 전환)가 각각 다른 테이블에 분산

---

### P1: 구조적 모호성 — 중기적 해결 필요

**문제 4: parents / student_connections / parent_student_links 삼중 관계**

| 테이블 | 목적 |
|--------|------|
| `student_connections` | RLS 접근 권한 (Auth user → student) |
| `parents` | CRM 연락처 (user 없이도 존재) |
| `parent_student_links` | CRM 관계 (parents ↔ students) |

→ 동일한 관계가 3곳에 표현됨  
→ 새 학부모 추가 시 어느 테이블을 primary source로 써야 할지 불명확

**문제 5: students.class_id (단일) vs student_enrollments (이력)**
```sql
students.class_id           -- 현재 반 (단일)
student_enrollments.class_id -- 배치 이력 (복수)
```
→ 한 학생이 여러 반을 수강하는 경우 students.class_id로 커버 불가  
→ enrollment와 class_id가 불일치할 때 어느 것이 truth인가?

**문제 6: users.academy_id 단일성**
→ 한 Teacher는 한 Academy만 소속 가능  
→ 국내 학원 시장에서 프리랜서 강사가 여러 학원에 근무하는 경우 불가

**문제 7: 단일 역할 강제**
→ `users.role`이 단일 값 → 한 사람이 Teacher+Parent 불가  
→ 실제: 학원 원장이 자기 자녀도 같은 학원에 등록하는 경우 흔함

---

### P2: 장기 확장성 — 향후 해결 필요

**문제 8: 멀티 학원 불가**
→ Staff는 academy_id가 단일  
→ 체인 학원, 프랜차이즈, 위탁 경영 구조 지원 불가

**문제 9: Person 레이어 부재**
→ "같은 사람"을 시스템이 인식할 방법 없음  
→ 이메일이 같아도 roles가 다르면 별개 계정

---

## 3. 추천 User Model

### 3.1 판단: Person Layer 도입 여부

두 가지 선택지를 비교한다:

#### Option A: 현재 구조 정리 (Incremental)

```
auth.users → users (role + academy_id 단일)
```

장점: 마이그레이션 비용 낮음, 현재 코드 최소 변경  
단점: 멀티 역할, 멀티 학원 불가. 구조적 문제 반복

#### Option B: Academy Membership 도입 (Recommended)

```
auth.users → users (identity only)
                └─ academy_memberships (role + academy 분리)
```

장점: 멀티 역할, 멀티 학원, RLS 명확화  
단점: 마이그레이션 비용 중간. 기존 코드 대규모 수정

#### 결론: **Option B (Academy Membership) 추천**

단, 전면 재작성이 아닌 **점진적 이전** 방식을 취한다.  
현재 `users.role`, `users.academy_id`를 유지하면서  
새 `academy_memberships` 테이블을 primary source로 올린다.

---

### 3.2 추천 User Model

```
users (Auth identity)
  id (= auth.users.id)
  email
  name
  phone
  gender, birthdate, avatar_url
  onboarding_complete
  ── role, academy_id 제거 (academy_memberships로 이전)

academy_memberships
  id
  user_id → users
  academy_id → academies
  role: 'owner' | 'teacher' | 'desk' | 'parent' | 'student'
  status: 'active' | 'inactive' | 'invited' | 'pending'
  joined_at
  UNIQUE (user_id, academy_id, role)
```

**이점:**
- 한 사람이 Owner + Parent 동시 가능
- 한 Teacher가 두 학원에 소속 가능
- RLS에서 `academy_memberships`만 조회하면 됨
- `users`는 순수 identity 레이어

**현재 users.role 호환:**
```sql
-- 현재 코드의 users.role은 computed view로 제공
CREATE VIEW current_user_role AS
SELECT user_id, role, academy_id
FROM academy_memberships
WHERE user_id = auth.uid() AND status = 'active'
LIMIT 1;
```

---

## 4. 추천 Academy 구조

```
academies
  id
  name
  owner_id → users (법적 소유자, 불변)
  connection_code (초대 코드)
  status (active|suspended|trial)
  timezone, phone, address, legal_name

academy_settings (1:1)
  academy_id
  operating_hours {}
  default_lesson_duration_min
  ...

academy_memberships (M:N hub)
  user_id, academy_id, role, status
  → 모든 권한 체계의 기준점

academy_invitations (초대 링크/코드)
  id
  academy_id
  invited_by → users
  role (teacher|desk|parent|student)
  token (UUID, 1회용 또는 다회용)
  expires_at
  max_uses, used_count
  status (active|expired|revoked)
```

**Academy는 다음 하위 엔티티를 소유한다:**

```
academies
  ├─ academy_memberships (구성원)
  ├─ classes (반)
  │    ├─ class_teachers (교사 배정)
  │    └─ class_schedules (시간표)
  ├─ students (CRM 레코드)
  │    ├─ student_enrollments (반 배치)
  │    └─ student_connections (portal 접근)
  ├─ lessons (수업)
  │    ├─ attendance_records
  │    └─ lesson_scores
  ├─ counseling_sessions
  ├─ parent_reports
  └─ terms (학기)
```

---

## 5. 추천 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         IDENTITY LAYER                          │
│                                                                 │
│  auth.users ─────► users                                        │
│                     id, email, name, phone                      │
│                     gender, birthdate, avatar_url               │
│                     onboarding_complete                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ 1:N
┌────────────────────────────▼────────────────────────────────────┐
│                      MEMBERSHIP LAYER                           │
│                                                                 │
│  academy_memberships                                            │
│    user_id → users                                              │
│    academy_id → academies                                       │
│    role: owner|teacher|desk|parent|student                      │
│    status: active|inactive|invited|pending                      │
└──────────┬──────────────────────────────────┬───────────────────┘
           │ N:1                              │ N:1
┌──────────▼───────────┐         ┌────────────▼───────────────────┐
│      ACADEMY         │         │          STAFF                 │
│                      │         │                                │
│  academies           │         │  staff_profiles (1:1 per memb) │
│  classes             │         │  class_teachers (M:N)          │
│  terms               │         │                                │
│  rooms               │         └────────────────────────────────┘
└──────────┬───────────┘
           │ 1:N
┌──────────▼───────────────────────────────────────────────────────┐
│                        STUDENT LAYER                             │
│                                                                  │
│  students (CRM — Auth 없이 존재 가능)                              │
│    id, academy_id, name, grade, school                           │
│    student_code (연결 코드)                                        │
│    enrollment_status                                             │
│                                                                  │
│  student_enrollments (반 배치 이력)                                │
│    student_id, class_id, term_id, status                         │
│                                                                  │
│  student_connections (portal 접근 — Auth user ↔ student)         │
│    user_id → users                                               │
│    student_id → students                                         │
│    relationship: mother|father|guardian|student                  │
└──────────┬───────────────────────────────────────────────────────┘
           │ 1:N
┌──────────▼───────────────────────────────────────────────────────┐
│                      OPERATIONAL LAYER                           │
│                                                                  │
│  lessons                                                         │
│    id, academy_id, class_id, lesson_date, teacher_id            │
│    status (scheduled|in_progress|closed|canceled)               │
│    unit, topic, lesson_memo                                      │
│    ├─ attendance_records (lesson_id, student_id, status)         │
│    ├─ lesson_scores (lesson_id, student_id, score)               │
│    └─ homework_submissions (assignment_id, student_id, status)   │
│                                                                  │
│  counseling_sessions                                             │
│    student_id, counselor_id, status, summary                     │
│    └─ parent_reports (generated from sessions)                   │
└──────────────────────────────────────────────────────────────────┘

PARENT RELATIONSHIP:
  users (role=parent via academy_memberships)
    └─ student_connections (user_id, student_id, relationship)
         ← 이것이 단일 truth. parents/parent_student_links는 CRM 보조
```

---

## 6. 추천 회원가입 Flow

### 설계 원칙
- 회원가입 단계에서는 학원과 연결하지 않는다
- Auth 계정만 생성한다
- 역할은 회원가입 시 선택한다 (academy_memberships는 없음)
- 온보딩에서 학원과 연결한다

```
[회원가입 화면]
  이메일 + 비밀번호 + 이름
  역할 선택: Owner | Teacher | Parent | Student
     ↓
  supabase.auth.signUp({
    data: {
      name,
      role: dbRole,          // admin|teacher|parent|student
      profile_setup: 'complete'
    }
  })
     ↓
  handle_new_user() trigger
    → public.users 생성 (academy_id=null, onboarding_complete=false)
    → academy_memberships 생성 SKIP (아직 학원 없음)
     ↓
  이메일 인증 (선택사항)
     ↓
  /onboarding 리다이렉트
```

**역할별 회원가입 경로:**

| 역할 | 가입 경로 | 특이사항 |
|------|-----------|---------|
| Owner | 자유 가입 | 온보딩에서 학원 생성 |
| Teacher | 초대 링크/코드 OR 자유 가입 | 자유 가입 시 온보딩에서 코드 입력 |
| Parent | 초대 링크/코드 OR 자유 가입 | 자유 가입 시 온보딩에서 학생 연결 |
| Student | 초대 링크/코드 OR 자유 가입 | 자유 가입 시 온보딩에서 학생 연결 |

**초대 링크 경로 (별도):**
```
academy_invitations.token → /invite/[token]
  → 역할/학원 pre-filled
  → 회원가입 완료 시 즉시 academy_memberships 생성
  → 온보딩 step 2 (학원 연결) skip
```

---

## 7. 추천 Onboarding Flow

### 공통 원칙
- Step 1은 모든 역할 동일: 기본 프로필
- Step 2는 역할별 학원/학생 연결
- Step 2 완료 또는 skip 후 `onboarding_complete = true`

```
[Step 1: 기본 프로필] — 전 역할 공통
  이름 (required)
  휴대전화
  성별 (남/여/기타)
  생년월일
  프로필 사진
    → users 업데이트
    → next →

[Step 2: 역할별 연결]

  ┌─ Owner ──────────────────────────────────────┐
  │  [새 학원 만들기]  |  [기존 학원 참여]          │
  │                                              │
  │  새 학원: 학원명 입력                           │
  │    → academies INSERT                        │
  │    → academy_memberships INSERT (owner)      │
  │                                              │
  │  기존 학원: connection_code 입력               │
  │    → 학원 조회 → academy_memberships INSERT   │
  └──────────────────────────────────────────────┘

  ┌─ Teacher ────────────────────────────────────┐
  │  초대 코드 입력 (academy.connection_code)      │
  │    → 학원 확인 표시                            │
  │    → student_connection_requests INSERT      │
  │      (staff 승인 대기 OR 즉시 승인)            │
  │  [나중에 입력] → skip 가능                     │
  └──────────────────────────────────────────────┘

  ┌─ Parent ─────────────────────────────────────┐
  │  학생 코드 입력 (students.student_code)        │
  │  자녀와의 관계 선택 (엄마/아빠/보호자)           │
  │    → submit_student_connection_request()     │
  │      (staff 승인 대기)                        │
  │  [나중에 연결] → skip 가능                     │
  └──────────────────────────────────────────────┘

  ┌─ Student ────────────────────────────────────┐
  │  학생 코드 입력 (students.student_code)        │
  │    → submit_student_connection_request()     │
  │      relationship = 'student'               │
  │  [나중에 연결] → skip 가능                     │
  └──────────────────────────────────────────────┘

[완료]
  users.onboarding_complete = true
  → roleHomePath() 리다이렉트
```

### 온보딩 게이트
```typescript
// AppShell, ParentShell, StudentShell 공통
if (profile?.onboarding_complete === false) {
  router.replace('/onboarding');
}
```

---

## 8. 추천 Teacher 구조

### 설계 원칙
- Teacher는 Class를 통해 Student를 관리한다 (직접 소유 아님)
- Teacher 교체 시 Student 데이터는 변하지 않는다

```
academy_memberships (role='teacher')
    │ user_id
    ▼
staff_profiles (1:1)
  user_id, academy_id
  employment_status, hire_date, permissions{}
    │ id = staff_id
    ▼
class_teachers (M:N)
  class_id, staff_id, role (homeroom|assistant|substitute)
  start_date, end_date (NULL = 현재)
    │ class_id
    ▼
classes
  id, academy_id, name, grade, subject
    │ id = class_id
    ▼
student_enrollments (active)
  student_id, class_id, status='active'
    │ student_id
    ▼
students
  id, name, grade, academy_id
```

### Teacher가 볼 수 있는 데이터
```
담당 Class → enrollment → Student (조회 가능)
  └─ lessons (해당 수업)
       ├─ attendance_records (해당 학생)
       └─ lesson_scores (해당 학생)
```

### classes.teacher_id 제거 계획
현재: `classes.teacher_id` (레거시) + `class_teachers` (정식)  
목표: `classes.teacher_id` Deprecated → `class_teachers`만 사용

```sql
-- 이행 전략: classes.teacher_id를 computed column으로
-- class_teachers WHERE role='homeroom' AND end_date IS NULL
```

### Teacher 초대 플로우
```
Staff → Settings → 초대 코드 생성 (academy_invitations)
Teacher → 코드 입력 → academy_memberships INSERT (status='active')
                   → staff_profiles 자동 생성 (trigger)
```

---

## 9. 추천 Parent 구조

### 설계 원칙
- Parent는 Student와 N:M 관계
- `student_connections`가 RLS의 단일 truth source
- `parents`는 CRM 메타데이터 (연락처, 선호 채널)

```
academy_memberships (role='parent')
    │ user_id
    ▼
users (Auth identity)
    │
    ▼
student_connections (RLS 권한 기준)
  user_id → users
  student_id → students
  relationship: mother|father|guardian|student
    │
    ▼
parents (CRM — user_id 있을 수도, 없을 수도)
  id, academy_id, user_id (nullable)
  name, phone, preferred_channel
    │ id = parent_id
    ▼
parent_student_links (CRM 관계 메타)
  parent_id, student_id
  relationship, is_primary, is_emergency_contact
```

### 중복 해소 방향

| 테이블 | 역할 | 유지 여부 |
|--------|------|---------|
| `student_connections` | RLS 접근 권한 | **유지 (primary)** |
| `parents` | CRM 연락처 | 유지 (secondary) |
| `parent_student_links` | CRM 관계 | 유지 (secondary) |

**단, `parents`와 `parent_student_links`는 `student_connections` 기반으로 자동 동기화. 직접 쓰기는 `student_connections`만.**

### Parent가 볼 수 있는 데이터
```sql
-- student_connections에 존재하는 student_id에 한해서만
SELECT * FROM lesson_logs WHERE student_id = $student_id;
SELECT * FROM consultation_cards WHERE student_id = $student_id;
SELECT * FROM parent_reports WHERE student_id = $student_id;
```

### 연결 승인 플로우
```
Parent → 학생 코드 입력 → student_connection_requests (pending)
Staff → Settings → 연결 요청 검토 → review_student_connection_request()
                → student_connections INSERT
                → parents upsert (trigger)
                → parent_student_links upsert (trigger)
```

---

## 10. 추천 Student 구조

### 설계 원칙
- Student는 Academy 소속 (Parent 소속 아님)
- Student 레코드는 Auth 계정 없이 존재할 수 있음 (학원이 직접 생성)
- Auth 계정이 생기면 `student_connections`로 연결됨
- 모든 운영 데이터는 student_id로 연결

```
academies
    │ academy_id
    ▼
students (CRM record)
  id, academy_id
  name, grade, school, birth_date, gender
  student_code (연결용 유일 코드)
  enrollment_status (prospect|active|on_leave|withdrawn|graduated)
  status (stable|attention|consultation)  ← 위험 신호
  special_notes
    │
    ├─ student_enrollments (반 배치 이력)
    │    class_id, term_id, status (active|ended|transferred)
    │
    ├─ student_connections (Auth portal 연결)
    │    user_id (parent or student Auth user)
    │    relationship
    │
    └─ [모든 운영 데이터]
         lessons → attendance_records
         lessons → lesson_scores
         homework_assignments → homework_submissions
         exams → exam_scores
         counseling_sessions
         parent_reports
         consultation_cards
         student_risk_snapshots
         student_payments
         student_memory_chunks (RAG)
```

### 현재 students.class_id 문제 해결

```
현재: students.class_id (단일, 현재 반)
목표: student_enrollments (이력)

이행 계획:
1. student_enrollments WHERE status='active' → 현재 반
2. students.class_id는 computed (trigger로 동기화 유지)
3. 장기적으로 students.class_id는 deprecated
```

### Student Auth 연결 플로우
```
[Case 1: 학원이 먼저 학생 등록 후 초대]
  Staff → 학생 등록 (students INSERT, student_code 발급)
  Staff → 초대 링크/코드 전달 (parent or student)
  Parent/Student → 가입 → 온보딩 → 코드 입력
    → student_connection_requests
    → 승인 → student_connections

[Case 2: Student 먼저 가입]
  Student → 회원가입 → 온보딩 → 학생 코드 입력
    → student_connection_requests
    → Staff 승인 → student_connections
```

---

## 11. 추천 RLS 구조

### 핵심 헬퍼 함수

```sql
-- 현재 사용자의 멤버십 (역할별 다중 가능)
CREATE FUNCTION current_memberships()
RETURNS TABLE(academy_id uuid, role text, status text)
AS $$
  SELECT academy_id, role, status
  FROM academy_memberships
  WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 특정 academy의 staff 여부
CREATE FUNCTION is_staff_of(p_academy_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM academy_memberships
    WHERE user_id = auth.uid()
      AND academy_id = p_academy_id
      AND role IN ('owner', 'teacher', 'desk')
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 primary academy_id
CREATE FUNCTION current_academy_id()
RETURNS uuid AS $$
  SELECT academy_id FROM academy_memberships
  WHERE user_id = auth.uid() AND status = 'active'
  ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'teacher' THEN 2 ELSE 3 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- student 접근 권한 (기존 유지)
CREATE FUNCTION user_connected_to_student(p_student_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM student_connections
    WHERE user_id = auth.uid() AND student_id = p_student_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 역할별 데이터 접근 권한

| 테이블 | Owner | Teacher | Desk | Parent | Student |
|--------|-------|---------|------|--------|---------|
| academies | R/W (own) | R | R | R | - |
| users | R (same academy) | R (same academy) | R (same academy) | R (self) | R (self) |
| academy_memberships | R/W | R (self) | R (self) | R (self) | R (self) |
| students | R/W | R/W (담당반) | R | R (own child) | R (self) |
| classes | R/W | R (담당반) | R | - | - |
| class_teachers | R/W | R | R | - | - |
| lessons | R/W | R/W (담당반) | R | R (own child) | R (self) |
| attendance_records | R/W | R/W (담당반) | R/W | R (own child) | R (self) |
| lesson_scores | R/W | R/W (담당반) | R | R (own child) | R (self) |
| consultation_cards | R/W | R/W | R | R (own child) | - |
| counseling_sessions | R/W | R/W | R | R (own child) | R (self) |
| parent_reports | R/W | R/W | R | R (own child) | - |
| student_payments | R/W | - | R/W | R (own child) | - |
| student_risk_snapshots | R/W | R/W | R | R (retention only, own child) | - |

### Teacher 세분화 (담당반 필터)

```sql
-- Teacher는 자신이 담당하는 반의 학생만 접근
CREATE FUNCTION is_teacher_for_student(p_student_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM class_teachers ct
    JOIN student_enrollments se ON se.class_id = ct.class_id
    JOIN staff_profiles sp ON sp.id = ct.staff_id
    WHERE sp.user_id = auth.uid()
      AND se.student_id = p_student_id
      AND se.status = 'active'
      AND ct.end_date IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### RLS 정책 패턴

```sql
-- students 테이블 예시
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Staff: 같은 academy
CREATE POLICY "staff_access_students" ON students
  FOR ALL TO authenticated
  USING (is_staff_of(academy_id));

-- Parent: 연결된 학생만
CREATE POLICY "parent_read_connected_student" ON students
  FOR SELECT TO authenticated
  USING (user_connected_to_student(id));

-- Student self
CREATE POLICY "student_read_self" ON students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_connections
      WHERE student_id = students.id
        AND user_id = auth.uid()
        AND relationship = 'student'
    )
  );
```

---

## 12. 추천 DB 변경사항

### 12.1 신규 테이블

```sql
-- academy_memberships: users.role + users.academy_id 대체
CREATE TABLE academy_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'teacher', 'desk', 'parent', 'student')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'invited', 'pending')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (user_id, academy_id, role)
);

-- academy_invitations: 초대 링크/코드 관리
CREATE TABLE academy_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('teacher', 'desk', 'parent', 'student')),
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  created_at timestamptz DEFAULT now()
);
```

### 12.2 수정 테이블

```sql
-- users: role, academy_id를 nullable로 변경 (academy_memberships로 이전)
-- 기존 코드 호환성을 위해 바로 삭제하지 않고 deprecated로 표시
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deprecated_role_note text
    DEFAULT 'Use academy_memberships.role instead';
-- 실제 삭제는 마이그레이션 최종 단계에서

-- students: 레거시 필드 deprecated
ALTER TABLE students
  -- 단계적 제거 계획
  -- parent_user_id: student_connections으로 대체 완료 시 DROP
  -- student_user_id: student_connections으로 대체 완료 시 DROP
  -- connection_code: student_code로 통일 시 DROP
  ;

-- classes: teacher_id deprecated (class_teachers 사용)
-- classes.teacher_id는 class_teachers homeroom role로 이동 완료 시 DROP
```

### 12.3 제거 예정 필드 (단계적)

| 테이블 | 필드 | 대체 | 제거 시점 |
|--------|------|------|---------|
| `students` | `parent_user_id` | `student_connections` | Phase 2 |
| `students` | `student_user_id` | `student_connections` | Phase 2 |
| `students` | `connection_code` | `student_code` | Phase 2 |
| `students` | `class_id` | `student_enrollments` | Phase 3 |
| `classes` | `teacher_id` | `class_teachers` | Phase 3 |
| `users` | `role` | `academy_memberships.role` | Phase 3 |
| `users` | `academy_id` | `academy_memberships.academy_id` | Phase 3 |

### 12.4 lesson_logs 정리

```sql
-- 목표: lesson_logs를 write target에서 read-only 뷰로 전환
-- lessons + attendance_records + lesson_scores가 primary

-- Phase 2: UI를 lessons 직접 쓰기로 이전
-- Phase 3: lesson_logs를 materialized view로 전환
-- Phase 4: lesson_logs deprecated

CREATE VIEW v_lesson_logs AS
  SELECT
    ar.student_id,
    l.class_id,
    l.lesson_date,
    l.teacher_id,
    l.unit,
    ar.status AS attendance_status,
    hs.status AS homework_status,
    ls.score AS test_score,
    l.id AS lesson_id
  FROM lessons l
  LEFT JOIN attendance_records ar ON ar.lesson_id = l.id
  LEFT JOIN lesson_scores ls ON ls.lesson_id = l.id AND ls.student_id = ar.student_id
  LEFT JOIN homework_submissions hs ON hs.lesson_id = l.id AND hs.student_id = ar.student_id;
```

---

## 13. Migration Plan

### Phase 1: 레거시 중복 제거 (즉시, 2~3주)

**목표:** 현재 구조 정리. 두 경로 → 하나

1. `students.student_code`를 공식 연결 코드로 확정
   - `connection_code`는 `student_code`로 마이그레이션 데이터 이전
   - 코드 참조를 `student_code`로 통일

2. `parent_user_id`, `student_user_id` null 확인
   - 이미 `student_connections`로 마이그레이션됐는지 검증
   - NULL 아닌 행 → `student_connections`로 backfill 재실행
   - 이후 컬럼 DROP

3. `classes.teacher_id` 참조 코드 → `class_teachers` homeroom 쿼리로 이전
   - 뷰 `v_class_homeroom_teacher` 생성으로 호환성 유지
   - 이후 `classes.teacher_id` DROP

```sql
-- Migration 037: legacy field cleanup
ALTER TABLE students
  DROP COLUMN IF EXISTS parent_user_id,
  DROP COLUMN IF EXISTS student_user_id,
  DROP COLUMN IF EXISTS connection_code;

CREATE VIEW v_class_homeroom_teacher AS
  SELECT ct.class_id, sp.user_id AS teacher_user_id, sp.id AS staff_id
  FROM class_teachers ct
  JOIN staff_profiles sp ON sp.id = ct.staff_id
  WHERE ct.role = 'homeroom' AND ct.end_date IS NULL;
```

---

### Phase 2: academy_memberships 도입 (중기, 4~6주)

**목표:** users.role/academy_id → academy_memberships 이전

1. `academy_memberships` 테이블 생성
2. 기존 `users` 데이터 → backfill
   ```sql
   INSERT INTO academy_memberships (user_id, academy_id, role, status)
   SELECT id, academy_id, role, 'active'
   FROM users
   WHERE academy_id IS NOT NULL AND role IS NOT NULL;
   ```
3. `is_academy_staff()`, `current_academy_id()` 헬퍼 함수 → academy_memberships 기반으로 재작성
4. `handle_new_user()` 트리거 수정 → academy_memberships 생성 추가
5. 앱 코드의 `users.role`, `users.academy_id` 참조 → 점진적 이전
   - `useAuth()` → `academy_memberships` 기반으로 재작성
   - `AuthContext` 업데이트

6. 구 `users.role`, `users.academy_id` deprecated (null 허용 변환)

```sql
-- Migration 038: academy_memberships
CREATE TABLE academy_memberships (...);

-- Backfill
INSERT INTO academy_memberships (user_id, academy_id, role)
SELECT id, academy_id, role FROM users
WHERE academy_id IS NOT NULL;

-- Handle new_user trigger 수정
-- RLS policy 수정
```

---

### Phase 3: lessons 정규화 완성 (중기, 3~4주)

**목표:** lesson_logs를 write target에서 제거

1. `app/(app)/lesson-logs/` UI → lessons/attendance_records/lesson_scores 직접 쓰기로 변경
2. `useLessonLogs()` → `useLessons()` 새 훅으로 이전
3. `lesson_logs` → read-only 뷰로 변환 (하위 호환)
4. `sync_lesson_log_to_normalized` 트리거 제거

---

### Phase 4: 멀티 역할 & 멀티 학원 활성화 (장기, 8+주)

**목표:** 한 사람이 여러 역할, 여러 학원 가능

1. 역할 전환 UI (사용자가 여러 멤버십 중 선택)
2. 학원 전환 UI
3. `academy_invitations` 완성 (초대 링크 생성/관리)
4. `users.role`, `users.academy_id` 컬럼 최종 DROP

---

## 14. 구현 우선순위

### 즉시 (이번 스프린트)

| 우선순위 | 작업 | 이유 |
|---------|------|------|
| P0 | students 레거시 필드 DROP | 데이터 불일치 버그 방지 |
| P0 | student_code를 공식 연결 코드로 확정 | 온보딩 코드가 이미 사용 중 |
| P0 | classes.teacher_id 참조 코드 → class_teachers 이전 | 조회 경로 이중화 제거 |

### 단기 (다음 1~2개 스프린트)

| 우선순위 | 작업 | 이유 |
|---------|------|------|
| P1 | academy_memberships 테이블 생성 + backfill | 멀티 역할/학원 기반 |
| P1 | student_connection_requests UI 완성 (Staff 승인 화면) | 온보딩 흐름 완성 |
| P1 | academy_invitations 테이블 + Teacher 초대 UI | Teacher 온보딩 핵심 |
| P1 | lesson_logs → lessons 직접 쓰기로 이전 | 트리거 복잡도 제거 |

### 중기 (분기 내)

| 우선순위 | 작업 | 이유 |
|---------|------|------|
| P2 | useAuth → academy_memberships 기반 재작성 | 새 구조 활성화 |
| P2 | RLS 전면 재검토 (academy_memberships 기준) | 보안 정확성 |
| P2 | parents / parent_student_links 중복 해소 | 데이터 일관성 |
| P2 | student_enrollments를 primary로 (class_id 제거) | 다반 수강 지원 |

### 장기 (반기 내)

| 우선순위 | 작업 | 이유 |
|---------|------|------|
| P3 | 역할 전환 UI | 멀티 역할 활성화 |
| P3 | 체인/프랜차이즈 학원 멀티 소속 | 사업 확장성 |
| P3 | lesson_logs 완전 deprecated | 레거시 제거 |

---

## 15. 장기 확장성 평가

### 현재 구조 (academy_memberships 도입 후) 지원 가능 여부

| 요구사항 | 현재 | 개선 후 |
|---------|------|---------|
| 멀티 역할 (Teacher + Parent) | ❌ | ✅ |
| 멀티 학원 소속 (강사) | ❌ | ✅ |
| 체인 학원 관리 | ❌ | △ (추가 작업 필요) |
| 프리랜서 강사 | ❌ | ✅ |
| 학생 다반 수강 | △ (enrollments 있으나 class_id 단일) | ✅ (enrollments primary 후) |
| 학부모 다자녀 | ✅ (student_connections N:M) | ✅ |
| 한 학부모 여러 학원 자녀 | △ | ✅ |

---

### Person Layer (더 먼 미래) 평가

```
User (Auth)
  └─ Person (실제 사람 — 이름, 연락처, 프로필)
       └─ AcademyMembership (academy + role)
```

**Person Layer의 장점:**
- 소셜 로그인 연결 복수 가능 (구글 + 카카오 → 같은 Person)
- 이름/연락처 변경이 전체 학원에 반영
- 한 Person이 여러 Auth 계정을 가졌다가 통합 가능

**Person Layer의 단점:**
- 구현 복잡도 대폭 상승 (RLS, Auth, 앱 전체 재작성)
- EduFlow 현 단계에서 필요하지 않음
- 국내 학원 시장에서 소셜 계정 통합 요구 낮음

**결론:** Person Layer는 도입하지 않는다.  
`users`(Auth identity) + `academy_memberships`(role/academy) 구조가 현 단계에서 최적.  
Person Layer는 사용자 수 10만+ 이상, 멀티 국가 진출 시점에 재검토.

---

### 최종 아키텍처 원칙

```
1. Academy 중심 권한
   모든 RLS는 academy_memberships를 기준으로 동작한다.

2. Student 중심 운영
   모든 운영 데이터(수업, 출석, 숙제, 상담)는 student_id로 연결된다.
   학생 데이터는 Teacher가 바뀌어도, Parent가 추가되어도 변하지 않는다.

3. 단일 Truth Source
   student_connections → RLS 접근 권한
   student_enrollments → 반 배치 이력
   lessons + attendance_records → 수업 기록
   각 도메인에 하나의 truth source만 있어야 한다.

4. 점진적 이전
   레거시 필드는 바로 DROP하지 않는다.
   신규 테이블을 primary로 올린 후, 레거시는 deprecated → 최종 DROP.

5. 구조는 단순하게
   Person Layer는 지금 필요하지 않다.
   academy_memberships로 멀티 역할/멀티 학원은 커버된다.
```

---

*이 문서는 코드 변경 없이 설계만 담고 있습니다.*  
*구현은 각 Phase별 Migration 파일로 진행합니다.*
