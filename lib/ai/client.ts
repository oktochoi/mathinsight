import type { ReportTone } from '@/types/database';
import type { AiPromptTask } from '@/lib/ai/prompts';

export type AiGenerateRequest = {
  task: AiPromptTask;
  studentId: string;
  periodStart: string;
  periodEnd: string;
  tone?: ReportTone;
};

export type AiGenerateResponse = {
  ok: boolean;
  source?: 'gemini' | 'rules';
  text?: string;
  points?: string[];
  error?: string;
  backend?: string;
  fallbackReason?: string;
};

export type AiBatchResponse = {
  ok: boolean;
  error?: string;
  learningSummary?: { text?: string; source?: 'gemini' | 'rules'; points?: string[]; fallbackReason?: string; backend?: string };
  evidenceSummary?: { text?: string; source?: 'gemini' | 'rules'; fallbackReason?: string; backend?: string };
  consultationPoints?: { text?: string; points?: string[]; source?: 'gemini' | 'rules'; fallbackReason?: string; backend?: string };
  parentMessage?: { text?: string; source?: 'gemini' | 'rules'; fallbackReason?: string; backend?: string };
};

/** 클라이언트 — /api/ai/generate (서버에서 수업 기록 로드) */
export async function fetchAiGenerate(body: AiGenerateRequest): Promise<AiGenerateResponse> {
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

/** 상담 카드 4종 일괄 생성 — HTTP 1회 */
export async function fetchAiGenerateBatch(input: {
  studentId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<AiBatchResponse> {
  const res = await fetch('/api/ai/generate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AiBatchResponse;
  if (!res.ok) {
    return { ok: false, error: data.error ?? res.statusText };
  }
  return data;
}
