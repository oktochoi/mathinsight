# EduFlow Product IA — AI 업무 비서 재설계

> 기능 추가 없이 **User Flow · 정보 구조(IA)** 만 재구성한 분석·설계 문서입니다.

---

## 1. 기존 메뉴 구조의 문제점

| 문제 | 설명 |
|------|------|
| **기능 나열형 사이드바** | 출결·숙제·성적·진도·수업기록·상담·상담카드·리포트… 원장 업무 순서와 무관 |
| **동일 데이터의 다중 입구** | 출결/숙제/점수가 `lesson-logs`, `attendance`, `homework`, `grades`에 분산 |
| **대시보드 과밀** | KPI 8개 + 퀵태스크 6개 + Action Center + Agent Center + 우선조치 + 아키텍처 패널 |
| **학생 상세 비중심** | 학생을 눌러도 다시 출결/숙제/상담 메뉴로 이동해야 함 |
| **버튼 과다** | 상담 생성·리포트·카드·준비모드·재등록 등 CTA가 화면마다 산재 |
| **ERP 인상** | 메뉴 수(18+)가 많아 보여 “배우기 전에 겁남” |

---

## 2. 중복되는 화면

| 데이터 | 원본(입력) | 조회 허브 | 중복 |
|--------|-----------|----------|------|
| 출결 | `/attendance` | 학생 상세 출결 섹션 | 의도적 조회 전용 |
| 숙제 | `/homework` | 학생 상세 | 동일 |
| 점수 | `/grades` | 학생 상세 차트 | 동일 |
| 수업 일괄 | `/lesson-logs` | 출결·숙제 화면 | lesson_logs 공유 |
| 상담 | `/counseling` | 학생 상세·상담카드 | 워크플로우 분리 필요 |
| 알림 | `/notifications` | 공지 `/notices` | 채널 다름(문자 vs 앱 공지) |
| 연동 | ~~`/integrations`~~ | `/settings?tab=integrations` | 통합 완료 |

---

## 3. 삭제 가능한 기능 (라우트 유지, 노출 축소)

기능 **삭제는 하지 않음**. 사이드바·대시보드에서 **숨기거나 2차 진입**으로 내림:

| 항목 | 처리 |
|------|------|
| `AgentArchitecturePanel` | 대시보드에서 제거 (개발·데모용) |
| `StaffDailyFlow` + `StaffPageIntro` (일부) | 대시보드·상담에서 제거, 설정/온보딩만 |
| KPI 그리드 8칸 | 「오늘 할 일」 리스트로 대체 |
| 학생 상세 다중 CTA | 「오늘 상담 시작」 1개 + 보조 링크 |
| `/integrations` 최상위 | `/settings?tab=integrations` 리다이렉트 |
| `/parent-reports` 사이드바 | 학생 상세·학부모 섹션에서만 진입 |

---

## 4. 통합 가능한 기능 (이미 동일 DB)

| 통합 방향 | 상태 |
|----------|------|
| 상담센터 / 예약 / 기록 | `/counseling` + `?view=` 탭 |
| 학생 / 반 / 학부모 | `/students` + `?tab=` |
| 연동 / 알림 설정 | `/settings` 탭 |
| 대시보드 조치 UI | Morning Brief + AI 추천 + 할 일 리스트 |

---

## 5. 원장이 가장 많이 쓰는 화면 순서 (가설 → 검증 필요)

1. **Dashboard** — 오늘 시작점  
2. **출결** `/attendance` — 수업 직후  
3. **학생 상세** — 이슈 학생 드릴다운  
4. **상담센터** `/counseling` — 예약·진행  
5. **숙제** `/homework` — 미제출 확인  
6. **문의함** `/messages` — 학부모 응대  
7. **수업 기록** `/lesson-logs` — 일괄 입력 선호 원장  
8. **설정** — 초기 1회 + 가끔  

---

## 6. 학생 중심 구조 개선안

**원칙:** 모든 신호는 `student_id`로 수렴, 입력은 전용 화면, 조회는 학생 상세.

```
학생 프로필 + [오늘 상담 시작]
    ↓
AI Summary (Digital Twin)
    ↓
오늘 상담 포인트 (브리핑)
    ↓
최근 변화
    ↓
출결 (조회) → /attendance
숙제 (조회) → /homework
성적 (조회) → /grades
상담 (조회) → /counseling
학부모 (연결·리포트)
Timeline
```

---

## 7. 정보 구조(IA) 재설계안

```
Home
 └─ Dashboard                    ← AI Morning Brief → AI 추천 → 오늘 할 일

학생
 ├─ 학생 (/students)
 ├─ 반 (/students?tab=classes)
 └─ 학부모 (/students?tab=parents)

수업
 ├─ 시간표
 ├─ 출결          ← 출결 입력 원본
 ├─ 숙제          ← 숙제 원본
 ├─ 성적
 ├─ 진도
 └─ 수업 기록     ← 일괄 입력 (lesson_logs)

상담
 ├─ 상담센터 (/counseling)
 ├─ 상담예약 (?view=book)
 ├─ 상담기록 (?view=history)
 └─ AI 상담 (/consultation-cards)

소통
 ├─ 공지
 └─ 문의

운영
 ├─ 결제
 ├─ 재등록
 ├─ 통계
 └─ 설정
      ├─ 기본 (학원·반·시간표)
      ├─ 연동 (ICS·SMS·카카오)
      └─ 알림 → /notifications 링크
```

**숨김 라우트 (직접 URL·딥링크):** `/parent-reports`, `/lesson-logs`, `/notifications`, `/schedule/prep`

---

## 8. 새로운 User Flow

### 아침
```
로그인 → Dashboard
  → AI Morning Brief 읽기
  → AI 추천 학생 [상담 시작]
  → 오늘 할 일 리스트에서 결석/숙제/문의 탭
```

### 수업 후
```
출결 체크 (/attendance)
  → (선택) 숙제 확인 (/homework)
  → 이슈 학생 → 학생 상세 → 상담 시작
```

### 상담
```
학생 상세 브리핑 확인
  → [오늘 상담 시작] → 상담예약/진행 (/counseling?view=book)
  → 필요 시 AI 상담 카드 (/consultation-cards)
  → 완료 후 상담기록 (?view=history)
```

### 주간·월간
```
재등록 스캔 (/retention) → 위험 학생 → 학생 상세
수강료 (/billing)
공지 (/notices)
```

---

## 구현 반영 (이번 커밋)

- `lib/staffNavigation.ts` — 업무 그룹 메뉴
- `components/Sidebar.tsx` — 그룹형 사이드바
- `DashboardClient.tsx` — AI First + 할 일 중심
- `StudentDetail.tsx` — 학생 허브 레이아웃
- `settings` — 연동·알림 탭
- `counseling` — view 탭 (센터/예약/기록)
- `students` — tab (학생/반/학부모)
- `/integrations` → settings 리다이렉트
