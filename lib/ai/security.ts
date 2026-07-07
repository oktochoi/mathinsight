/** AI 프롬프트·응답 보안 유틸 */

export const AI_LIMITS = {
  question: 2000,
  transcript: 8000,
  logMemo: 320,
  maxLogsInPrompt: 36,
  historyTurns: 4,
  historyMessage: 600,
} as const;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** 사용자 입력 — 제어문자 제거·길이 제한 */
export function sanitizeUserText(input: string, maxLen: number): string {
  return input.replace(CONTROL_CHARS, '').trim().slice(0, maxLen);
}

/** 클라이언트에 노출할 API 오류 — 키·내부 경로 누수 방지 */
export function sanitizeApiError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/api[_-]?key|secret|password|authorization|eyJ[a-zA-Z0-9_-]{10,}/i.test(raw)) {
    return 'AI 서비스 처리 중 오류가 발생했습니다.';
  }
  if (raw.length > 180) {
    return `${raw.slice(0, 180)}…`;
  }
  return raw;
}

const LEAK_PATTERNS = [
  /GEMINI_API_KEY|GOOGLE_API_KEY|TOSS_SECRET|SERVICE_ROLE/i,
  /systemInstruction|system instruction|프롬프트에 명시된/i,
  /\bAIza[0-9A-Za-z_-]{20,}/,
  /\bsk-[a-zA-Z0-9]{20,}/,
];

/** 모델 출력 후처리 — 민감 패턴·메타 발화 제거 */
export function guardAiOutput(text: string): string {
  let out = text.replace(CONTROL_CHARS, '').trim();
  for (const re of LEAK_PATTERNS) {
    if (re.test(out)) {
      out = out.replace(re, '[제거됨]');
    }
  }
  if (/^당신은 .*어시스턴트입니다/m.test(out)) {
    const idx = out.search(/\n\n/);
    if (idx > 0 && idx < 120) out = out.slice(idx + 2).trim();
  }
  return out;
}
