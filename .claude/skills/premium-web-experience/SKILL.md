---
name: premium-web-experience
description: mathinsight(EduFlow)의 마케팅/랜딩 페이지를 "10K 사이트"·"어워드 사이트" 급 프리미엄 UI로 만드는 작업을 조율하는 오케스트레이터. "랜딩페이지 고급스럽게/프리미엄하게 만들어줘", "커서/메뉴/캐러셀 이펙트 추가해줘", "시네마틱 히어로 만들어줘", "스크롤 애니메이션 넣어줘", "10K 사이트처럼", "어워드 사이트처럼" 같은 요청에 사용. 후속 작업(이전에 적용한 효과 수정/보완, 다른 페이지에도 똑같이 적용, 다시 만들기, 성능 문제 있는지 재점검) 요청 시에도 반드시 이 스킬을 사용할 것.
---

# Premium Web Experience Orchestrator

`10k-website-elements`·`award-winning-websites`·`castimedia_interactive_guide` 세 자료의 노하우를 mathinsight 마케팅 표면에 적용하는 작업을 조율한다.

## 실행 모드: 서브 에이전트 (전문가 풀 + 순차 파이프라인)

두 전문 에이전트(`premium-ui-builder`, `cinematic-asset-pipeline`)는 실시간 팀 통신이 필요 없다 — 요청 유형에 따라 필요한 전문가만 호출하거나(전문가 풀), 시네마틱 히어로가 필요하면 그 산출물 위에 나머지 UI를 이어 붙이는 순차 파이프라인이면 충분하다. 특히 `cinematic-asset-pipeline`은 사용자의 브라우저 작업 완료를 기다려야 하므로 **반드시 포그라운드(`run_in_background: false`)로 호출**하고, 그 결과를 받은 뒤에만 다음 에이전트를 호출한다.

## 에이전트 구성

| 에이전트 | subagent_type | 역할 | 스킬 | 언제 호출 |
|---------|---------------|------|------|----------|
| `cinematic-asset-pipeline` | 커스텀 | Whisk→ezgif→Canvas 히어로 파이프라인, 사용자 외부 작업 게이팅 | `cinematic-asset-pipeline` | 요청에 "시네마틱/히어로 애니메이션/스크롤 이미지/스크롤줌" 등이 있을 때 |
| `premium-ui-builder` | 커스텀 | 커서/메뉴/캐러셀/마이크로인터랙션/타이포그래피/스크롤 스토리텔링 구현 | `premium-ui-builder` | 그 외 일반 프리미엄 UI 요청, 또는 히어로 완성 후 페이지 나머지 폴리싱 |

모든 Agent 호출에 `model: "opus"`를 명시한다.

**중요 — 커스텀 subagent_type 미지원:** 이 환경에서는 `.claude/agents/{name}.md`로 정의한 커스텀 에이전트명을 `subagent_type`에 그대로 넣으면 `Agent type '{name}' not found` 에러가 난다 (사용 가능한 타입은 `claude`/`claude-code-guide`/`Explore`/`general-purpose`/`Plan`/`statusline-setup`뿐). 따라서 실제 호출 시 `subagent_type: "general-purpose"`를 쓰고, 프롬프트 맨 앞에 "당신은 `{agent-name}` 역할을 수행한다"고 명시한 뒤 해당 에이전트 `.md`와 연결된 스킬 `.md`(+ references)를 **Read로 직접 읽고 따르라**고 지시한다 — 요약만 프롬프트에 넣지 말고 원본을 읽게 한다.

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

1. `_workspace/premium-web-experience/` 존재 여부 확인
2. 분기:
   - **미존재** → 초기 실행, Phase 1로
   - **존재 + 사용자가 특정 부분 수정/보완 요청** → 부분 재실행. 관련 에이전트만 재호출하고, 이전 산출물 경로를 프롬프트에 포함해 "기존 결과를 읽고 피드백을 반영하라"고 지시
   - **존재 + 새 페이지/새 요청** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 재생성

### Phase 1: 철학 근거 확인 + 요청 분석 및 라우팅 판단

0. **철학이 먼저다.** `docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md`를 읽는다. 이 하네스는 "10K/어워드 사이트처럼 화려하게"가 목적이 아니라, 그 기법들을 수단 삼아 EduFlow의 철학(재등록을 지키는 AI 상담 인프라, 운영60·AI25·상담15, 첫인상의 차분한 확신)을 사용자가 화면에서 직접 경험하게 만드는 것이 목적이다. 대상 페이지가 철학 매핑 표의 어떤 원칙을 증명해야 하는지 먼저 정하고, 이후 모든 에이전트 호출 프롬프트에 이 판단을 포함한다.
1. 사용자 요청에서 대상 페이지/컴포넌트, 원하는 효과 종류를 파악한다.
2. 라우팅 결정:
   - 시네마틱 히어로/이미지 시퀀스/스크롤줌 요청이 **포함** → `cinematic-asset-pipeline` 먼저 호출 (Phase 2-A), 완료 후 같은 페이지의 나머지 요소가 필요하면 이어서 `premium-ui-builder` 호출 (Phase 2-B)
   - 그 외 (커서/메뉴/캐러셀/마이크로인터랙션/타이포그래피/일반 스크롤 리빌 등만 요청) → `premium-ui-builder`만 호출 (Phase 2-B)
3. 라우팅 판단과 앞으로 호출할 에이전트를 사용자에게 1~2문장으로 미리 알린다 — 예: "히어로 섹션은 시네마틱 이미지 시퀀스로 만들고, 이어서 메뉴와 타이포그래피를 다듬겠습니다."
4. `_workspace/premium-web-experience/00_request.md`에 요청 요약 저장

### Phase 2-A: 시네마틱 히어로 파이프라인 (필요 시)

```
Agent(
  description: "시네마틱 히어로 이미지 시퀀스 구현",
  subagent_type: "general-purpose",
  model: "opus",
  run_in_background: false,
  prompt: "당신은 이번 작업에서 cinematic-asset-pipeline 에이전트 역할을 수행한다. .claude/agents/cinematic-asset-pipeline.md와 .claude/skills/cinematic-asset-pipeline/SKILL.md(+ references/)를 Read로 먼저 읽고 그 지침을 그대로 따르라. 대상: {대상 페이지 경로}, {사용자가 원하는 히어로 컨셉/사진}. Phase 0(철학 확인)→Phase 1(Whisk)→Phase 2(ezgif)→Phase 3(코드 구현) 순서로 진행하라. Phase 1/2는 사용자에게 직접 설명·요청하고 확인받은 뒤에만 다음으로 진행하라. 완료 시 생성한 컴포넌트 경로를 명시해 보고하라."
)
```

결과(컴포넌트 경로)를 `_workspace/premium-web-experience/01_cinematic_output.md`에 기록한다.

### Phase 2-B: 프리미엄 UI 구현

```
Agent(
  description: "프리미엄 마케팅 UI 요소 구현",
  subagent_type: "general-purpose",
  model: "opus",
  run_in_background: false,
  prompt: "당신은 이번 작업에서 premium-ui-builder 에이전트 역할을 수행한다. .claude/agents/premium-ui-builder.md와 .claude/skills/premium-ui-builder/SKILL.md(+ references/)를 Read로 먼저 읽고 그 지침을 그대로 따르라. 대상: {대상 페이지 경로}, {원하는 요소 목록}. [Phase 2-A를 거쳤다면: 이미 완성된 히어로 컴포넌트 경로 {path}를 참고해 같은 페이지의 나머지 요소를 이어서 구현하라.] 시작 전 무엇을 할 예정인지 사용자에게 먼저 알려라."
)
```

결과를 `_workspace/premium-web-experience/02_ui_output.md`에 기록한다.

### Phase 3: 체크리스트 검증

오케스트레이터가 직접 수행한다 (별도 에이전트 불필요 — 체크리스트 대조는 가벼운 검토 작업이다):
1. `premium-ui-builder` 스킬의 `references/checklist.md` 기준으로 변경된 파일을 Read해 대조
2. 성능 항목(transform/opacity 사용 여부, will-change, 이미지 최적화)을 특히 확인
3. **철학 대조**: Phase 1에서 정한 "이 화면이 증명해야 할 철학 원칙"이 실제 결과물(정보 순서, 첫 메시지, 강조 요소)에 드러나는지 확인한다 — 단순히 시각적으로 화려해졌는지가 아니라, `docs/PRODUCT_PHILOSOPHY_FOR_DESIGN.md`의 매핑 표 기준으로 판단한다
4. 미통과 항목이 있으면 사용자에게 명시하고, 간단히 고칠 수 있는 것은 바로 수정

### Phase 4: 정리 및 보고

1. `_workspace/premium-web-experience/` 보존 (후속 요청 시 재사용)
2. 사용자에게 요약 보고: 어떤 요소를 어디에 적용했는지, 체크리스트 결과, (해당 시) 사용자가 직접 수행했던 외부 작업 단계
3. 개선하고 싶은 점이 있는지 물어본다

## 데이터 흐름

```
[사용자 요청]
     ↓
[Phase 1: 라우팅 판단] → _workspace/00_request.md
     ↓
[Phase 2-A: cinematic-asset-pipeline] (필요 시, 포그라운드)
     ↓ 컴포넌트 경로
_workspace/01_cinematic_output.md
     ↓
[Phase 2-B: premium-ui-builder] (포그라운드)
     ↓
_workspace/02_ui_output.md
     ↓
[Phase 3: 체크리스트 검증] (오케스트레이터 직접)
     ↓
[Phase 4: 보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| `cinematic-asset-pipeline`이 Phase 1/2(사용자 외부 작업) 확인을 못 받고 멈춤 | 정상 동작이다 — 사용자 응답을 기다린다. 임의로 다음 단계로 넘어가지 않는다 |
| 프레임 폴더가 확인되지 않음 | 에이전트가 Phase 2로 되돌아가 경로를 재확인하도록 유지 — 오케스트레이터가 대신 임의 경로를 만들지 않는다 |
| `premium-ui-builder`가 새 의존성(GSAP/Three.js) 필요를 보고 | 사용자에게 추가 여부를 직접 확인한 뒤 재호출 |
| 에이전트 1회 실패 | 1회 재시도. 재실패 시 어떤 부분이 안 됐는지 명시하고 나머지 결과로 진행 |

## 테스트 시나리오

### 정상 흐름 (시네마틱 히어로 포함)
1. 사용자: "제품 페이지 히어로를 시네마틱 스크롤 애니메이션으로 만들고 싶어"
2. Phase 1에서 `cinematic-asset-pipeline` 라우팅 결정, 사용자에게 통보
3. Phase 2-A 실행 — Whisk 안내 → 사용자 확인 대기 → ezgif 안내 → 사용자 확인 대기 → Glob 검증 → 컴포넌트 구현
4. Phase 2-B에서 같은 페이지에 메뉴/타이포그래피 폴리싱 이어서 적용
5. Phase 3 체크리스트 통과 확인
6. Phase 4 보고: 사용자가 한 일(Whisk/ezgif) vs 에이전트가 한 일(코드) 구분해서 요약

### 에러 흐름
1. 사용자: "히어로에 이미지 시퀀스 넣어줘" 요청 후 Whisk 작업을 하다가 중단
2. `cinematic-asset-pipeline`은 Phase 1 확인 대기 상태로 유지, 다음 단계로 넘어가지 않음
3. 사용자가 나중에 "이어서 진행해줘"라고 하면 Phase 0에서 `_workspace/`를 감지해 Phase 1(사용자 확인 대기) 지점부터 재개
