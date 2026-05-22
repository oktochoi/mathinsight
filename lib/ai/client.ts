import type { LessonLog, ReportTone, Student } from '@/types/database';
import type { AiPromptTask } from '@/lib/ai/prompts';

export type AiGenerateRequest = {
  task: AiPromptTask;
  logs: LessonLog[];
  student: Pick<Student, 'name' | 'grade'>;
  periodStart: string;
  periodEnd: string;
  academyName: string;
  tone?: ReportTone;
};

export type AiGenerateResponse = {
  ok: boolean;
  source?: 'gemini' | 'rules';
  text?: string;
  points?: string[];
  error?: string;
  /** source가 gemini일 때 Vertex AI / Google AI Studio */
  backend?: string;
  /** source가 rules일 때 Gemini를 쓰지 않은 이유 */
  fallbackReason?: string;
};

/** 클라이언트 — /api/ai/generate 호출 */
export async function fetchAiGenerate(
  body: AiGenerateRequest
): Promise<AiGenerateResponse> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as AiGenerateResponse;
  if (!res.ok) {
    return { ok: false, error: data.error ?? res.statusText };
  }
  return data;
}
