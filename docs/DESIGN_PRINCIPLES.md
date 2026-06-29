# EduFlow Design Principles

> UI 구현 시 참조. 상세 패턴: `components/data-ui/`, `components/dashboard/`

**제품 비율:** 운영 60% · AI 25% · 상담 15%

---

## 1. 운영 우선

원장이 로그인하면 **오늘 무엇을 해야 하는지**가 먼저 보입니다.

- Dashboard 첫 화면: 체크리스트 · 시간표 · 출결/숙제 · 학부모 문의
- CTA: 「오늘 수업 입력」이 최상단

## 2. 학생 중심

AI·차트보다 **학생 이름·반·상태**가 먼저입니다.

- 목록: 학생명 컬럼 고정 · 행 클릭 → 학생 상세
- AI는 학생 옆 보조 패널

## 3. AI는 Assistant Layer

AI는 장식이 아니라 **운영 판단 옆 조력자**입니다.

- Dashboard: AI 추천 업무 · AI 운영 요약 · AI 상담 준비 (25% 비중)
- 보라/인디고 톤으로 구분, 전체 화면 지배 금지
- UI 용어: AI 운영 요약, AI 추천 업무, 학생 요약, 상담 준비 메모

## 4. 신뢰감 있는 Data UI

B2B SaaS 운영 시스템처럼 보입니다.

- `@tanstack/react-table` 기반 DataTable
- recharts 운영형 차트 (ChartCard: 제목·수치·전주 대비·그래프)
- Skeleton · Empty · Loading 상태 필수

## 5. 정보 계층

| 요소 | 처리 |
|------|------|
| 숫자/KPI | 크게, tabular-nums |
| 설명 | text-xs text-slate-500 |
| 상태 | StatusBadge |

## 6. 색상 = 의미

| 색 | 의미 |
|----|------|
| Red | 관리 필요 |
| Orange | 주의 |
| Green | 정상 |
| Indigo/Violet | AI 추천 |
| Blue | 정보 |

## 7. 위젯 크기 구분

- **Large:** 오늘 해야 할 일, 시간표
- **Medium:** KPI, AI 운영 요약, 차트
- **Small:** 공지, 문의 건수

## 8. 실제 데이터처럼

- Dummy 텍스트·랜덤 그래프 금지
- `lesson_logs`·상담·재등록 실데이터 기반
- 빈 상태는 다음 액션 안내

---

## 컴포넌트 맵

| 용도 | 경로 |
|------|------|
| **Design System (Staff 표준)** | `components/design-system/` · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| DataTable | `components/data-ui/DataTable.tsx` |
| StatusBadge | `components/data-ui/StatusBadge.tsx` → `EduBadge` 권장 |
| ChartCard | `components/data-ui/ChartCard.tsx` |
| KpiMetric | `components/data-ui/KpiMetric.tsx` |
| Dashboard AI | `components/dashboard/DashboardAiLayer.tsx` |

→ [PROJECT_GOALS.md](../PROJECT_GOALS.md) · [ADR-006](../docs/adr/ADR-006-ai-as-assistant-not-hero.md)
