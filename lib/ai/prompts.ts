import type { LessonLog, ReportTone } from '@/types/database';
import { serializeLessonLogsForPrompt } from '@/lib/ai/serializeLogs';

/** 모든 Gemini 호출에 공통 적용 */
export const SYSTEM_INSTRUCTION = `당신은 수학학원 원장·강사를 돕는 기록 정리 어시스턴트입니다.

규칙:
- 제공된 수업 기록만 근거로 작성합니다. 기록에 없는 사실·수치·진단을 만들지 않습니다.
- 과장·마케팅·AI 자랑 문구를 쓰지 않습니다.
- 학부모·상담 맥락에 맞는 자연스러운 한국어를 사용합니다.
- 불확실하면 "기록상 ~"처럼 근거를 드러냅니다.
- 학부모 리포트·상담 카드는 딱딱한 요약이 아니라, 상담자가 학생을 이해하고 대화할 수 있도록 성의 있게 씁니다.`;

const TONE_LABELS: Record<ReportTone, string> = {
  friendly: '친근하고 따뜻한 톤',
  objective: '객관적·사실 중심 톤',
  exam_focused: '시험·성적·보완 학습 중심 톤',
  encouraging: '격려·동기 부여 톤',
};

export type PromptContext = {
  studentName: string;
  grade?: string;
  academyName: string;
  periodStart: string;
  periodEnd: string;
  logs: LessonLog[];
};

function baseContext(ctx: PromptContext): string {
  return [
    `학원: ${ctx.academyName}`,
    `학생: ${ctx.studentName}${ctx.grade ? ` (${ctx.grade})` : ''}`,
    `기간: ${ctx.periodStart} ~ ${ctx.periodEnd}`,
    '',
    '[수업 기록]',
    serializeLessonLogsForPrompt(ctx.logs),
  ].join('\n');
}

export const prompts = {
  learningSummary(ctx: PromptContext): string {
    return `${baseContext(ctx)}

[요청]
${ctx.studentName} 학생 **상담 전 학습 요약**을 작성하세요. 원장이 1분 안에 상황을 파악할 수 있어야 합니다.

작성 원칙:
- 기록만 근거로 합니다. 「최근 학습 단원: A, B, C」식 나열은 피하고, **이번 기간 학습이 어떻게 이어졌는지** 3~5문장으로 설명합니다.
- 숙제·시험·출결·태그를 자연스럽게 엮어, **잘한 점 1가지**와 **함께 살펴볼 부분 1~2가지**를 구체적으로 짚습니다 (기록에 있을 때만).
- 겁주거나 비난하지 않고, 상담 대화의 출발점이 되도록 씁니다.
- 기록 없으면 「해당 기간 수업 기록이 없어 상담 전 요약을 작성하기 어렵습니다.」 한 문장만.

본문만 출력합니다.`;
  },

  evidenceSummary(ctx: PromptContext): string {
    return `${baseContext(ctx)}

[요청]
상담 시 **근거로 짚을 수 있는 기록**을 정리하세요. 원장이 「왜 그렇게 말할 수 있는지」 바로 확인할 수 있게 합니다.

형식:
- 최근순 최대 6건
- 각 줄: 「· YYYY.MM.DD / 단원 / 출결 / 숙제 / 점수(있을 때) / 메모·태그(있을 때)」
- 한 건당 핵심이 한눈에 보이게, 불필요한 반복 생략
- 기록 없으면 「해당 기간 기록된 근거가 없습니다.」 한 줄만

본문만 출력합니다.`;
  },

  consultationPoints(ctx: PromptContext): string {
    return `${baseContext(ctx)}

[요청]
${ctx.studentName} 학생 **상담 대화 포인트** 3~5개를 작성하세요. 원장이 학부모·학생과 대화할 때 참고하는 메모입니다.

작성 원칙:
- 각 항목은 「- 」로 시작하는 한 줄
- 기록에 근거한 **구체적 질문·확인·제안** 형태로 (예: 「- 5/14 숙제 미제출 이후 제출 습관을 함께 점검해 보기」)
- 「반복 태그 ○○에 대한 보완」처럼 뻔한 문장 대신, **상담실에서 실제로 할 말**에 가깝게
- 긴급 이슈가 없으면 「- 기록상 큰 이슈는 없습니다. 이번 상담에서 학습 목표와 일정을 맞춰 보세요.」 포함
- 기록 없으면 「- 해당 기간 기록이 없어 포인트를 제안하기 어렵습니다.」 한 줄만

리스트만 출력합니다.`;
  },

  parentMessage(ctx: PromptContext): string {
    return `${baseContext(ctx)}

[요청]
상담 후 또는 상담 안내용으로 **학부모에게 보낼 짧은 메시지** 초안을 작성하세요.

작성 원칙:
- ${ctx.academyName} 담임 선생님 톤, **따뜻하고 성의 있게**
- 인사 → 이번 기간 학습 한 줄 (기록 기반, 구체적으로) → 학원이 함께 도울 방향 한 줄 → 문의 환영 → 감사
- 5~7문장, 카톡·문자에 붙여넣기 좋은 길이
- 「AI」「자동 생성」 표현 금지
- 기록이 거의 없으면, 상담 일정 안내와 문의 환영 위주로 짧게

본문만 출력합니다.`;
  },

  parentReport(ctx: PromptContext & { tone: ReportTone }): string {
    return `${baseContext(ctx)}

[요청]
${ctx.studentName} 학생 학부모에게 보낼 학습 리포트를 작성하세요. 상담 카드의 「학습 요약」처럼, 기록 근거가 분명하고 읽기 쉬워야 합니다.

톤: ${TONE_LABELS[ctx.tone]} — 담임 선생님이 학부모에게 정성껻 쓴 편지에 가깝게.

작성 원칙:
- 수업 기록만 근거로 합니다. 없는 점수·단원·행동을 지어내지 않습니다.
- 마크다운 금지: **, *, #, 목록 기호(-, *)를 쓰지 않습니다.
- 섹션 제목은 반드시 한 줄에 [제목] 형식만 사용합니다. (예: [이번 기간 한눈에])
- 각 섹션 본문은 2~4문장, 구체적 수치·단원·태그를 기록에서 가져와 자연스럽게 엮습니다.
- 장황한 교과서 설명(「중요한 개념 중 하나로」 등)은 넣지 않습니다.
- 「AI」「자동 생성」 표현 금지.

출력 형식 (아래 순서·제목 그대로, 본문만):

${ctx.studentName} 학생 학습 리포트 (${ctx.periodStart} ~ ${ctx.periodEnd})

안녕하세요, ${ctx.academyName}입니다. (인사 1~2문장)

[이번 기간 한눈에]
(출결·숙제·점수 추세·태그를 3~4문장으로 요약)

[수업에서 다룬 내용]
(기록에 있는 단원만, 2~3문장)

[숙제와 학습 습관]
(기록에 근거, 2~3문장. 이슈 없으면 안정적 흐름만)

[평가·시험]
(기록된 점수·추세만, 2~3문장. 없으면 「이 기간 기록된 점수가 없습니다.」)

[함께 보면 좋은 부분]
(가정에서 도울 점 2~3문장, 기록·태그 근거)

[맺음말]
(격려·문의 환영 1~2문장)

${ctx.academyName} 드림

중요: 반드시 [이번 기간 한눈에]부터 [맺음말]·「${ctx.academyName} 드림」까지 전 섹션을 한 번에 완성하세요. 중간에 출력을 끊지 마세요.`;
  },
} as const;

export type AiPromptTask = keyof typeof prompts;
