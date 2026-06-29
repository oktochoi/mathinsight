# EduFlow 제품 재포지셔닝 — 실행 계획

**포지션:** 재등록을 지키는 AI 상담 인프라  
**원칙:** 기능 추가 없음 · 기존 라우트 유지 · 노출·카피·흐름만 변경

---

## 1. 메뉴 — 숨김 / 유지 / 통합

| 처리 | 항목 |
|------|------|
| **유지 (전면)** | Dashboard, 상담센터, 재등록 위험, 학부모 문의, 학생, 반, 오늘 수업, 출결, 숙제, 성적, 공지, 리포트, 결제, 설정 |
| **숨김 (딥링크만)** | Analytics, Notifications, Integrations, Curriculum, 시간표, 상담예약/기록 단독, AI상담 단독, 학부모 탭 단독 |
| **통합** | Consultation Cards → 상담센터 `?step=prep` · Parent Reports → 소통·상담 완료 단계 · Retention → 상담 그룹「재등록 위험」 |

---

## 2. 새 IA

```
Home · 상담·재등록 Action Board (Dashboard)

상담 · 상담센터 · 재등록 위험 · 학부모 문의

학생 · 학생 · 반

수업 기록 · 오늘 수업(대표) · 출결 · 숙제 · 성적

소통 · 공지 · 리포트

운영 · 결제 · 설정(연동·알림·진도·시간표)
```

---

## 3–7. 화면별 개편 요약

- **Dashboard:** 6섹션 Action Board (상담 필수 → 재등록 위험 → 신호 악화 → 학부모 연락 → 미완료 상담 → 오늘 수업)
- **학생 상세:** 상담 판단·준비 허브 (AI요약·재등록·악화신호·상담포인트·CTA·요약 데이터)
- **상담센터:** 5단계 파이프라인 (대상→AI준비→진행→완료·메시지→후속)
- **오늘 수업:** lesson-logs = 일일 대표 입력 (출결·숙제·점수·메모)
- **학부모 포털:** 관리 증거 순 (주간요약→숙제→출결→성적→상담리포트→공지→수강료)

---

## 8. 카피 변경

ERP 용어 → 상담·재등록 용어 (`staffPages.ts`, PageHeader, Sidebar, Dashboard)

---

## 9. 수정 파일

`lib/staffNavigation.ts`, `lib/staffPages.ts`, `lib/dashboardMorningBrief.ts`, `types/database.ts`, `hooks/useDashboardStats.ts`, `components/dashboard/DashboardActionBoard.tsx`, `app/(app)/dashboard/DashboardClient.tsx`, `app/(app)/students/[id]/StudentDetail.tsx`, `app/(app)/counseling/page.tsx`, `app/(app)/lesson-logs/page.tsx`, `app/(app)/analytics/page.tsx`, `app/(app)/consultation-cards/page.tsx`, `app/parent/page.tsx`, `components/Sidebar.tsx`, `app/(app)/settings/page.tsx`

---

## 10. 수정 순서

1. IA·카피 (`staffNavigation`, `staffPages`)  
2. Dashboard 데이터·Action Board  
3. 학생 상세  
4. 상담센터 파이프라인  
5. 오늘 수업·보조 화면 카피  
6. 포털·리다이렉트  
