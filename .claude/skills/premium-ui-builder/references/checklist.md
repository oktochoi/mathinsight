# 10K 사이트 체크리스트 + 성능 리얼리티 체크

구현 완료 후 이 목록으로 자체 검수한다. 통과/미통과를 사용자에게 요약 보고한다.

## Visual Polish
- [ ] 기본 커서 대신 의도된 커서(있다면) — 브랜드에 안 맞으면 생략도 정답
- [ ] 일관된 spacing 시스템 (8px 배수 그리드)
- [ ] fluid typography(`clamp()`) 적용 여부
- [ ] 스크롤 리빌 최소 2곳 이상
- [ ] 모든 인터랙티브 요소에 hover/focus 상태

## Navigation
- [ ] 메뉴 애니메이션 (오버레이/드로어 등)
- [ ] sticky 또는 hide-on-scroll 헤더
- [ ] nav 링크 active 상태
- [ ] 모바일 햄버거 메뉴 부드러운 open/close

## Motion & Feel
- [ ] 라우트 전환 애니메이션 (있다면 fade/slide)
- [ ] 소셜 프루프/로고용 무한 캐러셀
- [ ] CTA 버튼에 마이크로 인터랙션 최소 1개
- [ ] smooth scroll 활성화 (Lenis)
- [ ] 액센트 컬러 1개만 사용, easing 통일 (`lib/motion.ts` 참조)

## Performance & Trust — "성능 리얼리티 체크"
가장 빠뜨리기 쉬운 카테고리다. 화려한 이펙트가 모바일에서 버벅이면 프리미엄이 아니라 아마추어처럼 보인다.

- [ ] `top`/`left` 대신 `transform`/`opacity`로 애니메이션했는가 (레이아웃 리플로우 방지)
- [ ] 무겁게 반복 애니메이션되는 요소에 `will-change: transform` 적용했는가
- [ ] 이미지가 lazy-load + WebP로 압축됐는가
- [ ] 이미지 시퀀스를 쓴다면 프레임 수가 60~150 범위이고, 모바일에서 다운샘플링 옵션이 있는가
- [ ] Lighthouse **모바일** 점수 확인 — 데스크톱만 확인하지 않는다
- [ ] Core Web Vitals: LCP < 2.5s, CLS ≈ 0
- [ ] 실제 저사양 기기(또는 Chrome DevTools 모바일 스로틀링)로 확인했는가

## 이 프로젝트 고유 규칙 (AGENTS.md)
- [ ] UI 카피가 한국어인가
- [ ] `(app)`/`(marketing)`/포털 셸 UI를 혼용하지 않았는가
- [ ] 최소 diff 원칙을 지켰는가 (관련 없는 파일 건드리지 않음)
- [ ] Staff 화면에 튜토리얼·StaffPageIntro를 임의로 추가하지 않았는가
