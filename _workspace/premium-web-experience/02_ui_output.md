# 02 · UI Output — Home `/`

Phase 2-B 완료. 대상: Home 한 페이지 (Task Size Rule).

## 변경 파일

| 파일 | 성격 |
|------|------|
| `components/marketing/home/HomeHeroConsole.tsx` | 신규 — 히어로 풀블리드 운영 표면 |
| `components/marketing/pages/HomePageContent.tsx` | 리라이트 |
| `components/marketing/home/RecordJourney.tsx` | AI 막 절제 + 마지막 막 재등록 착지 |

공통 컴포넌트(`CTASection`, `Section`, `FadeIn`, `Reveal`, `MarketingScreenMockup`, `lib/marketing/ui.ts`)는 수정하지 않음 — 다른 페이지 영향 없음.

## 섹션별 Before → After

### 1. 히어로
- **Before**: 좌 텍스트 / 우 브라우저 목업 카드 2단 + 떠다니는 조각 4개(`HERO_FRAGMENTS`) + 블러 글로우 2개 + 펄스 배지 + 바운싱 스크롤 화살표.
- **After**: 하나의 컴포지션. 브랜드 락업(마크 + EduFlow + 헤어라인 + "재등록을 지키는 AI 상담 인프라") → H1 → 문장 1 → CTA 2 + 정책 한 줄 → 화면 아래로 잘려 나가는 풀블리드 운영 콘솔.
- H1을 `기록이 상담이 되고, 상담이 재등록을 지킵니다`로 교체 — 기록→상담→재등록 체인이 헤드라인 안에서 완결.
- 배경: 블러 블롭 제거, 미세 수직 그라디언트 + 마스킹된 72px 헤어라인 그리드.
- 액센트: emerald 1개(`재등록` 한 단어 + CTA)만.

### 2. RecordJourney (스크롤 서사)
- **AI 막**: violet-950 풀스크린 다크 → `bg-slate-50` 밝은 지면 + 흰 패널, 보라는 라벨·좌측 2px 보더에만. 화면 점유율 약 25%로 축소(ADR-006 / 운영 60·AI 25·상담 15).
- AI 문장에 **근거 줄** 추가(`5/18 시험 88 → 76 · 숙제 미제출 2회 · 지난 상담 5/15`) — "넘겨짚지 않는다"는 신뢰 신호.
- **마지막 막**: 학생·학부모 포털 → **재등록**으로 리프레임. `재등록은 결제일에 결정되지 않습니다` + `기록 → 상담 → 재등록, 하루 안에서 이어집니다`.
- 진행 도트 라벨: `['대시보드','기록','AI 브리핑','상담','재등록']`.
- 스크롤 길이·막 가중치는 그대로(회귀 위험 없음).

### 3. 재등록 페이오프 (신규)
`이탈은 몇 주 전부터 신호를 보냅니다` + 헤어라인 3단 근거(위험 신호 감지 → 근거 있는 상담 → 재등록 판단) + 재등록·수납 화면 + `/re-enrollment` 조용한 링크.

### 4. 운영 표면 인덱스 (4카드 그리드 대체)
- **Before**: 솔루션 4카드 그리드(hover 리프트·그림자·아이콘 배지) + 앞서 본 목업을 다시 보여주는 "실제 화면" 섹션.
- **After**: 두 섹션을 하나로 흡수. `영역 / 담는 것 / →` 헤어라인 4행 인덱스, 카드·그림자·아이콘 없음. 4개 솔루션 페이지로 가는 약한 내부링크.

### 5. Pricing 티저
카드+에메랄드 링+플로팅 배지 → 헤어라인 3분할, `tabular-nums` 가격. 프로모션(`PROMO_ALL_FREE`) 분기·문구·가격값은 변경 없음.

### 6. CTA
`CTASection` 그대로 — 공용 컴포넌트 보존.

## checklist.md 대조

| 항목 | 결과 |
|------|------|
| 의도된 커서 | 생략(브랜드 부적합) — 의도적 미적용 |
| 8px 배수 spacing | 통과 |
| fluid typography `clamp()` | 통과 — H1 `clamp(2.25rem,5.4vw,4.25rem)` |
| 스크롤 리빌 2곳+ | 통과 — 히어로 스태거 / 섹션 FadeIn / 인덱스 Reveal |
| hover·focus 상태 | 통과 — CTA·인덱스 행·링크 화살표 |
| 메뉴 애니메이션 / sticky 헤더 / nav active / 모바일 햄버거 | 기존 `MarketingHeader` 유지(이번 범위 밖) |
| 라우트 전환 애니메이션 | 미적용(기존 상태 유지) |
| 무한 로고 캐러셀 | **의도적 미적용** — 실고객 로고 없음, 더미 로고는 신뢰 원칙 위반 |
| CTA 마이크로 인터랙션 | 통과 — 화살표 `translate-x` (CSS only) |
| Lenis smooth scroll | 기존 provider 유지 |
| 액센트 1개 + easing 통일 | 통과 — emerald + `lib/motion.ts` EASE |
| `transform`/`opacity`만 애니메이션 | 통과 — top/left 미사용 |
| 반복 애니메이션 `will-change` | 통과 — 무한 반복 요소 자체를 히어로에서 제거, 잔여 스크럽 요소는 기존 `willChange: transform` |
| 이미지 lazy·WebP | 히어로 콘솔은 이미지 0(순수 DOM), 브랜드 마크만 `priority` |
| 이미지 시퀀스 | 해당 없음 |
| Lighthouse 모바일 / CWV | **미측정** — 390px 에뮬레이션 육안 검증만 수행. LCP는 텍스트, 콘솔 높이 고정으로 CLS 리스크 낮음 |
| 저사양 기기 확인 | 부분 — DevTools 390×780 확인, 실기기 미확인 |
| 한국어 카피 | 통과 |
| 셸 혼용 없음 | 통과 — Staff/포털 import 0, `lib/marketing/ui.ts` 토큰만 |
| 최소 diff | 통과 — 3파일, 공통 컴포넌트 무수정 |
| 튜토리얼·StaffPageIntro | 해당 없음 |

`tsc --noEmit`: Home 관련 에러 0 (`app/sitemap.ts`의 `BLOG_POSTS` 에러는 기존 이슈, 범위 밖).

## 다음 페이지 준비 상태

Home에서 확립된 재사용 가능한 패턴:
1. **풀블리드 잘림 플레인** — `HomeHeroConsole` 구조를 Product/Workflow 히어로에 재사용 가능(현재는 Home 전용).
2. **헤어라인 인덱스 행** — 카드 그리드 대체 패턴. Product/Pricing/Academy 계열에 그대로 적용 가능.
3. **절제된 AI 표기** — 밝은 지면 + violet 라벨/좌측 보더 + 근거 줄. `/ai` 페이지에 반드시 이 규칙 적용 필요(현재 그 페이지는 미점검).
4. **모션 예산 2–3** — 히어로 스태거 / 스크롤 스크럽 / 섹션 리빌.

다음 권장 순서: `/product` → `/pricing` → `/contact`. 3개 이상 반복되면 헤어라인 인덱스 행을 `components/marketing/ui/`로 승격 검토.

---

# 02 · UI Output — Product `/product`

Home 다음 페이지. 대상: `/product` 한 페이지 (Task Size Rule).

## 변경 파일

| 파일 | 성격 |
|------|------|
| `components/marketing/product/ProductStudentPlane.tsx` | 신규 — 히어로 풀블리드 학생 평면 |
| `components/marketing/product/ProductWorkflowRail.tsx` | 신규 — 6·1·2 헤어라인 레일(스크롤 드로잉) |
| `components/marketing/pages/ProductPageContent.tsx` | 리라이트 |

공통 컴포넌트(`PageHero`, `SectionHeader`, `FeatureSection`, `PremiumWorkflowTimeline`, `ScreenTour`, `CTASection`, `lib/marketing/*`)는 **수정하지 않음** — 다른 페이지 영향 없음. `PremiumWorkflowTimeline`은 이 페이지에서 import만 해제(다른 페이지에서 계속 사용 중이므로 파일 유지).

## 이 페이지가 증명해야 할 철학

1. 운영 60 · AI 25 · 상담 15가 **화면 구조**로 보일 것 (AI가 지면을 지배하지 않을 것)
2. 기능 나열형 ERP가 아니라 **"기록이 상담 준비가 되는"** 제품일 것
3. Demo/tour는 실물 중심 유지

## 섹션별 Before → After

### 1. 히어로
- **Before**: `PageHero`(민트 그라디언트 배경) + 우측 `ScreenshotPlaceholder` 대시보드 카드.
- **After**: Home과 같은 언어의 풀블리드 잘림 평면. `Product` 헤어라인 → H1 → 문장 1 → CTA 2 + 정책 한 줄 → 화면 아래로 잘려 나가는 **학생 상세 평면**(`ProductStudentPlane`).
- Home 히어로가 "오늘(대시보드)"이라면 Product 히어로는 **학생 한 명** — 좌 기록 타임라인 / 중 변화(88→76, 92%→67%) / 우 상담 준비. 기록이 상담 준비로 변환되는 지점을 설명 없이 좌→우 한 줄로 보여준다.
- H1 `학생 한 명을 열면 / 상담 준비가 끝나 있습니다` (emerald 액센트는 `상담 준비` 한 곳).
- 배경·그리드·모션 값은 Home 히어로와 동일 토큰 재사용(시각 언어 연속성).

### 2. Composition (신규) — 60·25·15를 면적으로
`화면의 60%는 여전히 운영입니다` + 60fr/25fr/15fr 비율 바(슬레이트 / violet / emerald) + 같은 비율의 3열 설명. 철학의 핵심 비율을 문장이 아니라 **폭**으로 증명한다. 이 페이지에서 AI 관련 색면적을 가장 먼저 규정하는 장치.

### 3. Problem — 카드 3개 → 지금/EduFlow 대조 행
- **Before**: `ProblemCard` 3열 그리드.
- **After**: 헤어라인 3행. 좌 `지금`(문제, 회색) / 우 `EduFlow`(emerald 좌측 보더 + 처리 방식). 문제만 나열하지 않고 그 자리에서 제품의 답을 붙여 "기록 → 상담 준비" 전환을 반복해 각인시킨다. 답 문장 3개는 페이지 로컬 상수(`PROBLEM_ANSWERS`)로 추가, `siteStructure.ts`는 무수정.

### 4. Workflow — 컬러 밴드 → 헤어라인 레일
- **Before**: `PremiumWorkflowTimeline` — teal/violet/emerald 그라디언트 밴드 3개, 아이콘 노드 + 그림자, **AI 노드만 h-16(다른 노드 h-11) + 보라 그라디언트**로 가장 크게 표현. 운영 60·AI 25 원칙과 정면 충돌.
- **After**: `ProductWorkflowRail` — 9단계가 끊기지 않은 한 줄(9칸 헤어라인 사다리) 위에. 아이콘·그림자·배경색 전부 제거, AI(07)는 **크기를 키우지 않고 violet 번호 라벨 하나로만** 구분, 08·09만 emerald.
- 스크롤 진입 시 상단 레일이 좌→우로 그려지고(`scaleX`, `willChange: transform`) 번호가 순차적으로 짙어진다 — 라벨 텍스트는 항상 100% 불투명(JS 실패/리더 접근 시에도 읽힘).
- 모바일은 같은 순서를 3개 phase 그룹의 세로 헤어라인 목록으로.

### 5. AI Layer — 6카드 그리드 → 산출물 1개 + 조용한 인덱스
- **Before**: indigo 카드 6개(아이콘 배지 + `Badge tone="ai"`), 섹션 전체가 보라/인디고로 채워짐.
- **After**: 좌측에 **실제 산출물 하나**(밝은 지면 + 흰 패널 + violet 라벨/좌측 2px 보더 + `근거 · 5/18 시험 88→76 · 숙제 미제출 2회 · 지난 상담 5/15`), 우측에 6개 capability를 제목·설명·태그만의 헤어라인 인덱스로. violet은 eyebrow·아이콘·보더 3곳으로 제한.
- 카피도 조력자 포지션으로: `AI는 상담 3분 전에만 등장합니다` / `판단은 원장이 합니다`.

### 6. Product Tour
`ScreenTour` **그대로 유지**(실물 중심 유지 요구). 섹션 헤더만 Home과 같은 좌측 정렬 헤어라인 타이포로 교체하고 컨테이너 폭 정리.

### 7. Impact — KPI 카드 → 문장 행
- **Before**: `감소 / 향상 / 개선 / 효율 증가`를 teal 큰 글씨 + 카드 4개로. 수치처럼 보이지만 수치가 아니어서 신뢰 원칙 위반 소지.
- **After**: `label / value / sub` 헤어라인 4행 + 하단에 `숫자는 학원마다 다릅니다. EduFlow가 바꾸는 것은 원장이 시간을 쓰는 지점입니다.` 한 줄. 과장하지 않는 편이 "체계적인 학원" 신뢰 신호에 부합.

### 8. Coverage
4카드 그리드 → Home과 동일한 헤어라인 인덱스 4행(`영역 / 담는 것 / →`).

### 9. CTA
`CTASection` 그대로 — 공용 컴포넌트 보존.

## 앵커 호환

`#tour` 유지(`/demo` 라우트가 `/product#tour`로 redirect, Home 히어로도 링크). `#problem`·`#workflow`·`#ai`·`#impact` 유지, `#solution` 제거(히어로·Composition으로 흡수), `#composition` 신규.

## checklist.md 대조

| 항목 | 결과 |
|------|------|
| 의도된 커서 | 생략(브랜드 부적합) — Home과 동일하게 의도적 미적용 |
| 8px 배수 spacing | 통과 |
| fluid typography `clamp()` | 통과 — H1 `clamp(2.25rem,5.4vw,4.25rem)` |
| 스크롤 리빌 2곳+ | 통과 — 히어로 스태거 / 섹션 FadeIn / Problem·AI·Impact·Coverage Reveal / 워크플로 레일 스크럽 |
| hover·focus 상태 | 통과 — CTA 화살표, Coverage 행, 인덱스 링크 |
| 메뉴 애니메이션 / sticky 헤더 / nav active / 모바일 햄버거 | 기존 `MarketingHeader` 유지(범위 밖) |
| 라우트 전환 애니메이션 | 미적용(기존 상태 유지) |
| 무한 로고 캐러셀 | **의도적 미적용** — 실고객 로고 없음 |
| CTA 마이크로 인터랙션 | 통과 — 화살표 `translate-x` (CSS only) |
| Lenis smooth scroll | 기존 provider 유지 |
| 액센트 1개 + easing 통일 | 통과 — emerald 액센트 + AI 전용 violet, `lib/motion.ts` EASE |
| `transform`/`opacity`만 애니메이션 | 통과 — `scaleX`·`opacity`·`y`만 사용, top/left 없음 |
| 반복 애니메이션 `will-change` | 통과 — 무한 반복 요소 없음, 스크럽 라인에 `willChange: transform` |
| 이미지 lazy·WebP | 신규 섹션 이미지 0(순수 DOM). 히어로 평면도 이미지 없음 |
| 이미지 시퀀스 | 해당 없음 |
| Lighthouse 모바일 / CWV | **미측정** — 390×780 에뮬레이션 육안 검증만. LCP는 텍스트, 평면 높이 고정으로 CLS 리스크 낮음 |
| 저사양 기기 확인 | 부분 — DevTools 390×780 확인, 실기기 미확인 |
| 한국어 카피 | 통과 |
| 셸 혼용 없음 | 통과 — Staff/포털 import 0 |
| 최소 diff | 통과 — 3파일(신규 2 + 리라이트 1), 공통 컴포넌트·`siteStructure.ts` 무수정 |
| 튜토리얼·StaffPageIntro | 해당 없음 |

`tsc --noEmit`: Product 관련 에러 0 (`app/sitemap.ts`의 `BLOG_POSTS` 에러는 기존 이슈, 범위 밖).
브라우저 확인 중 뜬 `1 Issue`는 `components/brand/BrandLogo.tsx`의 기존 hydration 경고 — 이번 변경과 무관(헤더 공통).

## 다음 페이지 준비 상태

Product에서 추가로 확립된 패턴:
1. **비율 바** — 제품 철학의 정량 원칙(60·25·15)을 면적으로 보여주는 장치. `/ai`, `/workflow`에 재사용 가능.
2. **지금 → EduFlow 대조 행** — 문제 카드 그리드의 대체. `/academy-consulting`, `/re-enrollment`에 적합.
3. **헤어라인 스크럽 레일** — 단계형 흐름의 카드/밴드 대체. `/workflow`에 그대로 적용 가능.
4. AI 표기 규칙은 Home과 동일하게 유지 — 밝은 지면 + violet 라벨/좌측 보더 + 근거 줄, 색면적 3곳 이내.

다음 권장 순서: `/pricing` → `/workflow` 또는 `/ai`. 헤어라인 인덱스 행은 Home·Product 2회 반복 — 1회 더 쓰이면 `components/marketing/ui/`로 승격 검토.
