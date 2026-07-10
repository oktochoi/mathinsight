---
name: premium-ui-builder
description: 커서 이펙트, 메뉴 애니메이션(풀스크린 오버레이/드로어/메가메뉴), 무한 캐러셀, 마이크로 인터랙션(hover/focus/스켈레톤/스크롤 리빌/토스트), 타이포그래피 스케일, 스크롤 스토리텔링(피닝/스크러빙/스태거), 시네마틱 인트로 로더, Shape Blur 등 "10K 웹사이트"·"어워드 사이트" 급 프리미엄 UI 디테일을 이 프로젝트의 기존 스택(Framer Motion + Lenis)으로 구현할 때 사용. 마케팅/랜딩 페이지를 "더 고급스럽게", "임팩트 있게" 만들어달라는 요청에도 트리거할 것.
---

# Premium UI Builder

이 스킬은 `10k-website-elements`·`award-winning-websites` 두 레퍼런스 자료의 기법을 mathinsight(Next.js 16 + React 19 + Tailwind + **이미 설치된** Framer Motion/Lenis/Embla/Sonner) 스택에 매핑해 구현하는 절차를 담는다.

## 진행 전 필수 절차

0. **철학부터 확인한다.** `docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md`를 읽고, 적용 대상 화면이 그 문서의 "철학 → 화면 증거 매핑" 표 중 어떤 원칙을 증명해야 하는지 정한다. 이 스킬의 목적은 원본 자료(10K/어워드 사이트)를 그대로 흉내 내는 것이 아니라, 그 기법을 수단 삼아 EduFlow의 철학을 사용자가 화면에서 실제로 경험하게 만드는 것이다. 이 판단이 이후 "어떤 요소를 얼마나 강조할지"를 결정한다 — 예: 신뢰감이 핵심인 화면은 장식보다 빈 상태·실데이터 표기가 우선하고, "기록→상담→재등록" 서사를 보여줘야 하는 화면은 카드 나열보다 스크롤 스토리텔링이 우선한다.

코드를 쓰기 시작하기 전에 사용자에게 알린다:
1. 어떤 요소(들)를 적용할 것인지, 그리고 그것이 위 0번의 철학 판단과 어떻게 연결되는지 (예: "재등록 서사를 강조하기 위해 히어로에 스크롤 리빌 + 무한 로고 캐러셀을 추가하겠습니다")
2. 적용 범위 (어떤 페이지/컴포넌트)
3. 새 의존성이 필요하면(3D 등, 아래 "스택 선택 원칙" 참조) 추가 여부를 먼저 확인받는다 — 원칙적으로 새 라이브러리를 추가하지 않고 기존 스택으로 구현한다.

이 프로젝트는 이미 프리미엄 랜딩(`app/(marketing)/`)을 갖춘 실서비스이므로, 사용자가 의도치 않은 대규모 변경을 원치 않을 수 있다. 작업 전 통보는 되돌리기 비용을 줄인다.

## 스택 선택 원칙 — 왜 GSAP/Three.js를 새로 추가하지 않는가

원본 자료는 GSAP+ScrollTrigger, Three.js, Spline을 전제로 코드를 제시하지만, 이 프로젝트의 package.json에는 이미 `framer-motion`(애니메이션), `lenis`(smooth scroll), `embla-carousel-react`(캐러셀), `sonner`(토스트)가 설치돼 있다. 이 넷만으로 원본 자료의 효과 대부분(스크럽, 피닝, 스태거, hover 인터랙션, 무한 캐러셀, 토스트)을 동일하게 구현할 수 있다. 새 애니메이션 라이브러리를 추가하면 번들 크기가 커지고 두 시스템이 충돌할 여지가 생기므로, 실시간 3D 렌더링(파티클, 인터랙티브 지오메트리)처럼 Framer Motion으로 불가능한 요구가 아니면 GSAP/Three.js를 제안하지 않는다.

| 원본 기법 | 원본 라이브러리 | 이 프로젝트 구현 |
|-----------|----------------|------------------|
| 스크롤 스크러빙/피닝 | GSAP ScrollTrigger | Framer Motion `useScroll` + `useTransform` (+ Lenis로 smooth scroll) |
| 스태거 리빌 | GSAP stagger | Framer Motion `staggerChildren` (variants) |
| 무한 캐러셀/마퀴 | 커스텀 CSS | 순수 CSS `@keyframes`로 충분 (라이브러리 불필요), 카드형은 Embla |
| 커서 이펙트 | 커스텀 JS | Framer Motion `motion.div` + `mousemove` 리스너 |
| 토스트 | 커스텀 | 이미 설치된 `sonner` 그대로 사용 |
| 실시간 3D | Three.js/Spline | **기본 미도입.** 진짜 필요하면 사용자 확인 후 Three.js 추가 |

## 적용 범위 판단

- 기본 대상: `app/(marketing)/` (about, pricing, product, resources 등 공개 마케팅 페이지)
- 커스텀 커서·시네마틱 로더·풀스크린 오버레이 메뉴 같은 "쇼케이스형" 효과는 Staff ERP(`app/(app)/`)나 학부모/학생 포털처럼 매일 쓰는 업무 화면에는 어울리지 않는다 — 요청 범위가 애매하면 사용자에게 먼저 확인한다.
- AGENTS.md 절대 규칙 준수: 한국어 UI 카피, 셸 간 UI 혼용 금지, 최소 diff, Staff 화면에 튜토리얼 임의 추가 금지.

## 카테고리별 구현 가이드

각 카테고리의 구체적 코드 패턴(Framer Motion 버전으로 재작성됨)은 아래 references를 필요할 때만 로드한다.

| 카테고리 | 언제 로드 | 파일 |
|----------|----------|------|
| 커서/메뉴/캐러셀/마이크로인터랙션/타이포그래피/Shape Blur | 해당 요소 구현 시 | `references/effects-cookbook.md` |
| 스크롤 스토리텔링(피닝/스크러빙/스태거) + 시네마틱 인트로 로더 | 스크롤 연동 애니메이션 구현 시 | `references/scroll-storytelling.md` |
| 10K 체크리스트 + 성능 리얼리티 체크 | 구현 완료 후 자체 검수 시 | `references/checklist.md` |

## 완료 후 자체 검수

구현이 끝나면 `references/checklist.md`의 체크리스트로 자체 검수하고, 통과/미통과 항목을 사용자에게 요약 보고한다. 특히 성능 항목(모바일에서 `transform`/`opacity` 기반 애니메이션인지, 무거운 효과에 `will-change`가 있는지)은 빠뜨리기 쉬우므로 반드시 확인한다.
