# EduFlow Role & Permission System Design

> **상태 (2026-07-25):** 핵심 권한 체계는 **구현 완료**. 이 문서는 설계 이력 + 현재 코드 기준 요약이다.
> 구현 출처: `lib/permissionKeys.ts`, `lib/permissions.ts`, `lib/serverAuth.ts`, `lib/staffNavigation.ts`, `components/settings/StaffPermissionsSection.tsx`, `hooks/useStaffScope.ts`

---

## 0. 현재 구현 요약 (코드 기준)

| 항목 | 상태 |
|------|------|
| 역할 `owner` / `teacher` / `desk` / `parent` / `student` | ✅ (`admin`→`owner` 매핑) |
| Permission key 19개+ (`schedule.view`/`manage` 포함) | ✅ |
| `DEFAULT_PERMISSIONS` + `staff_permission_overrides` | ✅ |
| 사이드바 `requiredPermissions` 필터 | ✅ |
| Route 가드 (`proxy.ts` + `getRequiredPermissionForPath`) | ✅ |
| API `requirePermission()` | ✅ (민감 API 일부) |
| Teacher Scope (`useStaffScope` → `useStudents` / `useClassSchedules`) | ✅ |
| 부원장(`admin`) UI 옵션 | ⚠️ 역할 라벨만 — 권한은 owner와 동일(`ALL_PERMISSIONS`) |

---

## 1. 역할 모델

### DB
`users.role`: `'admin' | 'teacher' | 'desk' | 'parent' | 'student'`  
앱: `fromDbRole('admin') → 'owner'`

### 앱 `UserRole`
`'owner' | 'teacher' | 'desk' | 'parent' | 'student'`

### 워크스페이스
`academy_memberships`(학원×역할) — 초대 우선 온보딩과 함께 활성화. 로그인 후 멤버십 2개 이상이면 `/choose-workspace`.

---

## 2. 기본 권한 (DEFAULT_PERMISSIONS)

| 키 | owner | teacher | desk |
|----|-------|---------|------|
| students.* | ✅ | view | view/create/edit/withdraw |
| lessons.* | ✅ | view/manage | ❌ |
| schedule.view | ✅ | ✅ | ✅ |
| schedule.manage | ✅ | ❌ | ✅ |
| counseling.* | ✅ | ✅ | ✅ |
| billing.* | ✅ | ❌ | ✅ |
| analytics.view | ✅ | ❌ | ❌ |
| settings.* | ✅ | ❌ | ❌ |
| scope.all_students | ✅ | ❌ (오버라이드 가능) | — |

원장이 설정 → **직원·권한** 탭에서 역할별 오버라이드를 켠다.

---

## 3. Teacher Scope

강사(`role=teacher`)는 `class_teachers`(+ 레거시 `classes.teacher_id`) 담당 반만:
- `useStudents` — `class_id IN scope`
- `useClassSchedules` — 담당 반 일정만
- 담당 반 0개면 빈 목록 (전체 노출 금지)

---

## 4. Route / API 가드

- **Route:** `proxy.ts`가 `getRequiredPermissionForPath(path)`로 사이드바와 동일 키를 검사. 없으면 `/dashboard`로 리다이렉트.
- **API:** `requirePermission(supabase, key)` — 예: `settings.academy`, `billing.manage`, `parent_comms.send`, `retention.manage`.

---

## 5. 남은 과제 (중기)

| 과제 | 비고 |
|------|------|
| 부원장(`admin`)을 owner와 권한 차등 | 지금은 ALL_PERMISSIONS 공유 |
| 전 API에 `requirePermission` 일괄 적용 | 현재 민감 엔드포인트만 |
| `staff_profiles.permissions` jsonb 레거시 정리 | overrides 테이블이 실제 소스 |

---

## 6. 설계 이력

아래 섹션은 최초 설계안(미구현 전제)이다. **§0~5가 현재 진실**이다.

<details>
<summary>초기 설계 초안 (참고용, 폐기된 전제 포함)</summary>

당시 전제: desk 없음, permission 미구현, Teacher Scope 없음, analytics 사이드바 미게이트.
현재 코드는 위 전제를 뒤집고 구현을 완료했다. 세부 권한표·마이그레이션 초안은 git 이력의 이전 버전을 참고.

</details>
