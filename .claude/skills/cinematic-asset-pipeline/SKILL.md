---
name: cinematic-asset-pipeline
description: Google Whisk로 시네마틱 히어로 프레임/애니메이션을 생성하고, ezgif로 WebP 프레임으로 변환한 뒤, Next.js Canvas 스크롤 스크러버 컴포넌트로 구현하는 3단계 파이프라인. "시네마틱 히어로", "스크롤 이미지 시퀀스", "Apple 스타일 스크롤줌 히어로" 요청 시 사용. 브라우저 외부 툴(Whisk/ezgif) 단계는 사용자가 직접 수행해야 하므로, 매 단계 전환 전 반드시 사용자에게 무엇을 할 예정인지 설명하고 외부 작업이 필요하면 요청 후 완료 확인을 받은 뒤에만 다음 단계로 진행할 것.
---

# Cinematic Asset Pipeline

`castimedia_interactive_guide` 자료의 Whisk → ezgif → 코드 구현 워크플로우를 이 프로젝트(Next.js + Framer Motion, Google Antigravity/Gemini 불필요 — Claude Code가 Phase 3을 직접 수행)에 맞게 정리한 절차.

## 절대 원칙: 단계 게이팅

이 워크플로우는 사람이 브라우저에서 직접 해야 하는 구간(Phase 1~2)과 에이전트가 코드로 처리하는 구간(Phase 3)이 섞여 있다. **Phase 1과 Phase 2는 에이전트가 절대 대신할 수 없다** — Whisk 업로드도, ezgif 변환도 브라우저 UI 조작이 필요한 작업이기 때문이다.

각 Phase마다 반드시:
1. 지금부터 할 일을 1~2문장으로 설명한다.
2. 사용자가 직접 해야 할 작업이면 명확히 요청하고, 완료 여부를 사용자 응답으로 확인한다.
3. 확인받기 전에는 절대 다음 Phase로 넘어가지 않는다 — 프레임 파일이 실제로 존재하는지 Glob으로 검증한 뒤에만 Phase 3을 시작한다.

이걸 생략하면 사용자가 진행 상황을 오해하거나, 에이전트가 존재하지 않는 이미지를 참조하는 코드를 만들어버리는 사고로 이어진다.

## Phase 0 — 철학 근거 확인

Whisk 프롬프트를 제안하기 전에 `docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md`를 읽는다. 히어로 이미지는 "시네마틱해서 멋있는" 장면이 아니라 EduFlow의 철학(차분한 확신, 재등록을 지키는 AI 상담 인프라)을 압축해 보여줘야 하므로, 어떤 분위기·색감·구도로 Whisk 프롬프트를 짤지는 대상 페이지가 증명해야 할 철학 원칙에서 역산한다.

## Phase 1 — Google Whisk로 에셋 생성 (사용자 작업)

정확한 프롬프트 템플릿과 사용법은 `references/whisk-and-ezgif.md`를 로드한다. 사용자의 실제 브랜드/컨셉에 맞게 프롬프트를 조정해 제안한다.

완료 조건: 사용자가 프레임/애니메이션 생성을 마쳤다고 확인.

## Phase 2 — ezgif로 웹 변환 (사용자 작업)

정확한 설정값(Resolution/FPS/Quality)과 프레임 추출 절차는 `references/whisk-and-ezgif.md`를 로드한다. 프레임을 저장할 경로를 사용자와 합의하고(`public/sequence/{slug}/` 권장), Phase 3에서 작성할 컴포넌트가 참조할 정확한 경로와 반드시 일치시킨다.

완료 조건: 사용자가 프레임 폴더를 합의된 경로에 넣었다고 확인 **+ Glob으로 실제 파일 존재를 검증**.

## Phase 3 — Next.js Canvas 컴포넌트 구현 (에이전트 작업)

컴포넌트 구조와 전체 코드 패턴(스크롤 진행률 → 프레임 인덱스 매핑)은 `premium-ui-builder` 스킬의 `references/scroll-storytelling.md`에 있는 `ScrollyCanvas` 패턴을 그대로 사용한다 — 이 스킬에서 코드를 중복 관리하지 않는다.

추가로 이 Phase에서 만들 것:
- `Overlay`(패럴랙스 텍스트) 컴포넌트: `useTransform(scrollYProgress, [0, 0.5, 1], [-40, 0, 40])`처럼 스크롤 진행률에 따라 텍스트를 좌→중앙→우로 이동
- 페이지에 통합 후 개발 서버에서 실제 스크롤 동작을 확인

프레임 수가 60~150장 범위를 벗어나면(너무 적으면 끊김, 너무 많으면 초기 로딩 지연) 사용자에게 알린다.

## 완료 후

`premium-ui-builder` 에이전트에게 이어서 같은 페이지의 메뉴/타이포그래피/마이크로 인터랙션 폴리싱을 맡길지 사용자에게 물어본다 (오케스트레이터가 이미 파이프라인으로 호출한 경우 자동으로 이어진다).
