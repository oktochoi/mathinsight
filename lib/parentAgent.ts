import { generateWithGemini } from '@/lib/ai/gemini';
import { isGeminiConfigured, geminiConfigHint, getGeminiConfigStatus } from '@/lib/ai/env';
import { PARENT_AGENT_SYSTEM } from '@/lib/ai/parentAgentPrompt';
import { formatParentAgentAnswer } from '@/lib/parentAgentFormat';
import type { ParentAgentContextBundle } from '@/lib/parentAgentContext';

export type ParentAgentChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ParentAgentResult =
  | { ok: true; answer: string; source: 'gemini' | 'rules'; fallbackReason?: string }
  | { ok: false; error: string };

const SUGGESTED_QUESTIONS = [
  '우리 아이 최근 상태는 어떤가요?',
  '함수 단원은 이해하고 있나요?',
  '상담이 필요한 상황인가요?',
  '집에서 어떤 부분을 도와주면 좋을까요?',
];

export function getSuggestedParentQuestions(): string[] {
  return [...SUGGESTED_QUESTIONS];
}

const STUDENT_SUGGESTED_QUESTIONS = [
  '내 최근 학습 상태는 어때?',
  '숙제를 어떻게 하면 좋을까?',
  '이번 시험 준비는 뭘 해야 해?',
  '선생님께 물어볼 만한 게 있을까?',
];

export function getSuggestedStudentQuestions(): string[] {
  return [...STUDENT_SUGGESTED_QUESTIONS];
}

function scoreTrendHint(scores: number[]): string {
  if (scores.length < 2) return '· 추이: 비교할 이전 점수가 더 필요합니다.';
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const delta = last - prev;
  if (delta <= -8) return '· 추이: 최근 점수가 이전보다 내려간 흐름이 기록에 있습니다.';
  if (delta >= 8) return '· 추이: 최근 점수가 이전보다 올라간 흐름이 기록에 있습니다.';
  return '· 추이: 최근 점수는 큰 변동 없이 유지되는 편으로 기록됩니다.';
}

function logsMentionSubmitted(text: string): boolean {
  return /숙제:complete/.test(text) || /숙제:partial/.test(text);
}

function answerWithRules(
  question: string,
  ctx: ParentAgentContextBundle
): string {
  const lines: string[] = [
    `${ctx.studentName} 학생에 대한 질문을 받았습니다.`,
    '아래는 학원에 기록된 데이터만을 바탕으로 한 안내입니다.',
    '',
  ];

  if (ctx.contextText.includes('(해당 기간 수업 기록 없음)')) {
    lines.push('최근 4주간 등록된 수업 기록이 없어 구체적인 학습 흐름을 말씀드리기 어렵습니다. 학원에 문의해 주시면 감사하겠습니다.');
    return lines.join('\n');
  }

  if (/상담|필요/.test(question)) {
    if (/미제출|하락|계산 실수/.test(ctx.contextText)) {
      lines.push('기록상 숙제 미제출이나 점수·태그 변화가 보일 수 있습니다. 정확한 상담 필요 여부는 담임 선생님과 확인하시는 것이 좋습니다.');
    } else {
      lines.push('기록만으로는 긴급 상담이 필요하다고 단정하기 어렵습니다. 궁금하신 점은 학원으로 연락 주세요.');
    }
  } else if (/함수|단원/.test(question)) {
    const unitMatch = ctx.contextText.match(/단원:([^\|]+)/g);
    if (unitMatch?.length) {
      const units = [...new Set(unitMatch.map((u) => u.replace('단원:', '').trim()))].slice(-3);
      lines.push(`최근 기록된 단원에는 ${units.join(', ')} 등이 있습니다. 세부 이해도는 수업·시험 기록을 함께 보시면 좋습니다.`);
    } else {
      lines.push('최근 단원 정보가 기록에서 명확하지 않습니다. 학원 시간표·리포트를 참고해 주세요.');
    }
  } else if (/도와|집에서|습관/.test(question)) {
    lines.push('기록에 숙제 미제출이나 반복 메모가 있다면, 제출 루틴·오답 정리를 가정에서 함께 점검해 주시면 도움이 됩니다.');
    lines.push('구체적인 학습 방법은 담임 선생님께 문의해 주세요.');
  } else if (/상태|최근|어떤/.test(question)) {
    const hw = ctx.contextText.match(/숙제:미제출/g)?.length ?? 0;
    const scores = [...ctx.contextText.matchAll(/점수:(\d+)/g)].map((m) => Number(m[1]));
    lines.push('최근 4주 수업 기록을 기준으로 정리하면 다음과 같습니다.');
    if (scores.length > 0) {
      const recent = scores.slice(-4);
      lines.push(
        `· 점수: ${recent.join('점 → ')}점 순으로 기록되어 있습니다.`,
        scoreTrendHint(recent)
      );
    }
    if (hw > 0) {
      lines.push(`· 숙제: 미제출이 ${hw}회 기록되어 있어, 제출 루틴을 함께 점검해 보시면 좋겠습니다.`);
    } else if (logsMentionSubmitted(ctx.contextText)) {
      lines.push('· 숙제: 최근 기록상 제출이 비교적 안정적으로 보입니다.');
    }
    if (hw === 0 && scores.length === 0) {
      lines.push('· 출결·숙제·점수가 아직 충분히 쌓이지 않았을 수 있습니다. 학부모 리포트를 함께 참고해 주세요.');
    }
    lines.push('세부 해석·상담 필요 여부는 담임 선생님과 확인하시면 가장 정확합니다.');
  } else {
    lines.push('질문과 관련된 내용은 위 기록 범위 안에서 확인해 주세요. 더 자세한 내용은 학원 담임 선생님께 문의하시면 정확합니다.');
  }

  lines.push('', '※ 이 답변은 저장된 수업·리포트 기록을 바탕으로 한 참고 안내이며, 최종 판단은 학원 상담을 통해 확인해 주세요.');
  return formatParentAgentAnswer(lines.join('\n'));
}

export async function runParentAgent(
  question: string,
  ctx: ParentAgentContextBundle,
  history: ParentAgentChatMessage[] = []
): Promise<ParentAgentResult> {
  const q = question.trim();
  if (!q) return { ok: false, error: '질문을 입력해 주세요.' };

  if (!isGeminiConfigured()) {
    return {
      ok: true,
      answer: answerWithRules(q, ctx),
      source: 'rules',
      fallbackReason: geminiConfigHint(getGeminiConfigStatus()),
    };
  }

  const historyBlock =
    history.length > 0
      ? history
          .map((m) => `${m.role === 'user' ? '학부모' : '안내'}: ${m.content}`)
          .join('\n')
      : '(없음)';

  const userPrompt = `[대상 학생] ${ctx.studentName} (ID: ${ctx.studentId})
※ 이 학생의 기록만 사용하세요. 다른 학생 정보는 없습니다.

[학생 데이터]
${ctx.contextText}

[이전 대화 — 같은 학생에 대한 후속 질문]
${historyBlock}

[학부모 질문]
${q}

위 데이터만 근거로 8~14문장(또는 "• " 로 시작하는 항목 3~5개)으로 충분히 답변하세요.
기록에 없는 내용은 추측하지 마세요. 답변을 끝까지 완성하세요.

출력: 마크다운 없이 평문만. **, #, 백틱, 링크 문법 사용 금지. 읽기 쉽게 단락 구분.`;

  const geminiOptions = {
    systemInstruction: PARENT_AGENT_SYSTEM,
    temperature: 0.35,
    maxOutputTokens: 8192,
  };

  try {
    const answer = await generateParentAgentAnswer(userPrompt, q, geminiOptions);
    return { ok: true, answer, source: 'gemini', fallbackReason: undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: true,
      answer: answerWithRules(q, ctx),
      source: 'rules',
      fallbackReason: `AI 호출 실패 → 기록 기반 안내로 대체 (${message})`,
    };
  }
}

/** 규칙 기반 빠른 요약 (로그 배열 직접 전달 시) */
export function buildQuickParentAnswerFromLogs(
  question: string,
  studentName: string,
  logs: import('@/types/database').LessonLog[],
  academyName: string
): string {
  const ctx: ParentAgentContextBundle = {
    studentId: '',
    studentName,
    grade: '',
    academyName,
    contextText: [
      `학원: ${academyName}`,
      `학생: ${studentName}`,
      '[수업 기록]',
      logs.length
        ? logs
            .map(
              (l) =>
                `- ${l.lesson_date} ${l.unit} 숙제:${l.homework_status} ${l.test_score != null ? l.test_score + '점' : ''}`
            )
            .join('\n')
        : '(해당 기간 수업 기록 없음)',
    ].join('\n'),
  };
  return answerWithRules(question, ctx);
}

function isTruncatedFinish(reason?: string): boolean {
  return reason === 'MAX_TOKENS' || reason === 'LENGTH';
}

/** 토큰 한도로 잘린 경우 이어쓰기 (최대 2회) */
async function generateParentAgentAnswer(
  initialPrompt: string,
  question: string,
  options: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  }
): Promise<string> {
  let combined = '';
  let prompt = initialPrompt;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { text, finishReason } = await generateWithGemini(prompt, options);
    combined += combined && !combined.endsWith('\n') ? '\n' : '';
    combined += text.trim();

    if (!isTruncatedFinish(finishReason)) {
      break;
    }

    const tail = combined.slice(-2500);
    prompt = `[대상 학생 질문 — 동일]
${question}

아래는 미완성 답변입니다. 중단된 부분부터 이어서 끝까지 완성하세요. 앞부분을 반복하지 마세요. 마무리 문장으로 닫으세요.
마크다운(**,#,백틱 등) 없이 평문만 쓰세요.

[미완성 답변]
${tail}`;
  }

  const trimmed = combined.trim();
  if (!trimmed) {
    throw new Error('빈 응답');
  }
  return formatParentAgentAnswer(trimmed);
}
