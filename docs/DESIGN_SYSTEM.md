# EduFlow Design System

> Staff ERP(`app/(app)/`) UI의 공통 디자인 언어.  
> 원칙: [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) · 구현: `components/design-system/` · 토큰: `app/globals.css`

**이 문서는 적용 기준입니다.** 개별 페이지 일괄 마이그레이션은 별도 작업에서 진행합니다.

---

## 빠른 시작

```tsx
import {
  PageTitle,
  SectionTitle,
  Button,
  EduBadge,
  KpiCard,
  AppTimeline,
  ChartPlaceholderCard,
  AppDrawer,
  AppEmptyState,
  TableShell,
} from '@/components/design-system';
```

| Shell | Design System 사용 |
|-------|-------------------|
| Staff ERP | ✅ `components/design-system/` |
| Marketing | ❌ `lib/marketing/ui.ts` |
| Parent/Student Portal | ❌ portal 전용 CSS |
| Auth | ❌ `components/auth/*` |

---

## 1. Typography

중요도는 **색상보다 크기·굵기**로 표현합니다.

| 계층 | CSS 클래스 | React 컴포넌트 | 용도 |
|------|-----------|----------------|------|
| Page Title | `.app-page-title` | `PageTitle` | 페이지 최상단 제목 |
| Section Title | `.app-section-title` | `SectionTitle` | 섹션 구분 |
| Card Title | `.app-card-title` | `CardTitle` | 카드·위젯 제목 |
| Primary Metric | `.app-metric` | `PrimaryMetric` | 중간 KPI |
| KPI (large) | `.app-kpi` / `.app-kpi-lg` | `KpiValue` | 대시보드 핵심 숫자 |
| Body | `.app-body` | `BodyText` | 본문 |
| Caption | `.app-caption` | `Caption` | 보조 설명 |
| Muted | `.app-muted` | `MutedText` | 차분한 부가 정보 |
| Label | `.app-label` | — | uppercase 섹션 라벨 |

숫자 KPI는 `tabular-nums`를 사용합니다.

---

## 2. Color Tokens

Neutral 중심. 상태 외 과한 색상 사용 금지.

| Token | CSS 변수 | 용도 |
|-------|---------|------|
| Background | `--app-bg` | 페이지 배경 |
| Surface | `--app-surface` | 카드·패널 |
| Surface 2 | `--app-surface-2` | 리스트 행·입력 배경 |
| Surface Elevated | `--app-surface-elevated` | 강조 카드 |
| Border | `--app-border` | 기본 테두리 |
| Text Primary | `--app-ink` | 제목·핵심 텍스트 |
| Text Secondary | `--app-ink-2` | 본문 |
| Text Muted | `--app-ink-3` | 설명 |
| Accent | `--app-accent` | Primary CTA |
| Success | `--app-success` | 정상·완료 |
| Warning | `--app-warning` | 주의·미납 |
| Danger | `--app-danger` | 위험·연체 |
| Info | `--app-info` | 정보·예정 |

TypeScript 참조: `lib/design/tokens.ts`

---

## 3. Spacing (8px Grid)

| Token | 값 | 용도 |
|-------|-----|------|
| `--space-xs` | 4px | 아이콘 간격 |
| `--space-sm` | 8px | 버튼·배지 내부 |
| `--space-md` | 12px | 컴팩트 패딩 |
| `--space-lg` | 16px | 카드 기본 패딩 |
| `--space-xl` | 24px | 섹션 내부 |
| `--space-2xl` | 32px | 섹션 간 (`--page-gap`) |
| `--space-3xl` | 48px | 페이지 상하 여백 |

권장 리듬: 페이지 `space-y-10` · 섹션 `space-y-4` · 카드 padding `var(--card-padding)`

---

## 4. Card System

| 종류 | 컴포넌트 | 용도 |
|------|----------|------|
| Base | `AppCard` | 공통 컨테이너 |
| KPI Card | `KpiCard` | 운영 숫자 |
| Action Card | `ActionCard` | 다음 행동 유도 |
| Insight Card | `InsightCard` | AI·상담 인사이트 |
| Timeline Card | `AppCard variant="timeline"` | 타임라인 컨테이너 |
| List Card | `ListCard` | 헤더+리스트 |
| Chart Card | `ChartCardShell` | 차트 영역 |
| Empty Card | `EmptyCard` | 빈 상태 |

공통 기준: `border-radius: var(--r-lg)`, `border: 1px solid var(--app-border)`, shadow 최소(`--s-sm`).

구조: `CardHeader` · `CardBody` · `CardFooter`

---

## 5. Button System

| Variant | 클래스 | React |
|---------|--------|-------|
| Primary | `.app-btn-primary` | `Button variant="primary"` |
| Secondary | `.app-btn-secondary` | `Button variant="secondary"` |
| Ghost | `.app-btn-ghost` | `Button variant="ghost"` |
| Danger | `.app-btn-danger` | `Button variant="danger"` |
| Icon | `.app-btn-icon` | `Button iconOnly` |

Size: `sm` (32px) · `md` (기본) · `lg` (44px)

기존 `className="app-btn app-btn-primary"` 패턴도 계속 유효합니다. 신규 코드는 `<Button>` 권장.

---

## 6. Badge System

단일 소스: `EduBadge` (`data-ui/StatusBadge` 래퍼)

```tsx
<EduBadge preset="overdue" />
<EduBadge preset="attention" />
<EduBadge label="커스텀" tone="info" />
```

프리셋: `lib/design/badgePresets.ts` — 예정, 진행 중, 완료, 마감 필요, 미납, 완납, 연체, 정상, 관심, 위험, AI

**통합 방향:** `DashboardPrimitives.StatusBadge` → `EduBadge`로 점진 교체

---

## 7. Table System

Modern Data Table shell (`components/design-system/Table.tsx`):

- `TableShell` — border + radius 컨테이너
- `TableToolbar` + `TableSearch` — 필터/검색 영역
- `DataTableShell` — sticky header, hover row
- `TableEmptyRow` — 빈 상태 + CTA

기존 `@tanstack/react-table` 래퍼 `components/data-ui/DataTable.tsx`는 유지.  
신규/리디자인 시 Table shell 클래스를 적용하는 방향으로 마이그레이션.

행 클릭 → `AppDrawer` 연결 패턴 권장.

---

## 8. Drawer / Modal

| | Drawer | Modal |
|---|--------|-------|
| 컴포넌트 | `AppDrawer` | `AppModal` |
| 용도 | 상세 조회·컨텍스트 패널 | 확인·생성 등 중요 작업 |
| 위치 | 오른쪽 슬라이드 | 중앙 |
| 구조 | Header · Body · Footer | Header · Body · Footer |

기존 `StudentPaymentDrawer`, `StudentLessonDrawer`, `BillingChargeModal`은 동일 패턴.  
리디자인 시 `AppDrawer`/`AppModal`로 교체.

---

## 9. Empty State

`AppEmptyState` 구조:

1. Illustration Placeholder (이미지 없음)
2. Title
3. Description
4. Primary Action
5. Secondary Action (optional)

기존 `components/ui/DataStates.EmptyState`는 단순 버전.  
풍부한 빈 화면은 `AppEmptyState`, 테이블 내부는 `TableEmptyRow`.

---

## 10. Timeline

`AppTimeline` — EduFlow 핵심 기록 UI

| 필드 | 설명 |
|------|------|
| date / time | 시간축 |
| type | 이벤트 종류 라벨 |
| title | 제목 |
| summary | 요약 |
| statusPreset | `EduBadge` 프리셋 |
| href / action | 링크·행동 |

**통합 방향:** `StudentTimeline` + `StudentActivityTimeline` → `AppTimeline` + 데이터 어댑터

---

## 11. Chart Placeholder

`ChartPlaceholder` — 단독 placeholder  
`ChartPlaceholderCard` — 제목·설명·범례·placeholder 통합

```
[ Chart Placeholder — Attendance Trend ]
```

실제 차트: 기존 `components/data-ui/ChartCard.tsx` (recharts) 유지.  
Placeholder가 필요한 리디자인 단계에서는 `ChartPlaceholderCard` 사용.

---

## 기존 컴포넌트 맵 (마이그레이션 참고)

| 기존 | Design System 대응 | 조치 |
|------|-------------------|------|
| `app-btn` 클래스 | `Button` | 병행 → 점진 교체 |
| `app-card` / `DashboardCard` | `AppCard` / `KpiCard` | Dashboard는 당분간 유지 |
| `data-ui/StatusBadge` | `EduBadge` | 프리셋 추가로 확장 |
| `data-ui/KpiMetric` | `KpiCard` | 스타일 통일 예정 |
| `data-ui/DataTable` | `TableShell` + DataTable | shell 클래스 적용 |
| `DataStates.EmptyState` | `AppEmptyState` | 기능 확장 버전 |
| `DashboardPrimitives.WidgetEmpty` | `AppEmptyState` | 통합 |
| Billing/Student Drawer | `AppDrawer` | 리디자인 시 교체 |
| `StudentActivityTimeline` | `AppTimeline` | 어댑터 후 통합 |

---

## 신규 페이지 체크리스트

- [ ] `PageTitle` / `SectionTitle`로 계층 정리
- [ ] `--app-*` 토큰 또는 `design-system` 컴포넌트 사용
- [ ] Tailwind slate 하드코딩 대신 CSS 변수 우선
- [ ] 상태는 `EduBadge` 프리셋
- [ ] 상세는 `AppDrawer`, 확인은 `AppModal`
- [ ] 빈 화면은 `AppEmptyState` + 다음 액션
- [ ] 기록 흐름은 `AppTimeline`

---

→ [DESIGN_PRINCIPLES.md](./DESIGN_PRINCIPLES.md) · [ADR-004](./adr/ADR-004-no-shadcn.md) · [ADR-005](./adr/ADR-005-separated-ui-shells.md)
