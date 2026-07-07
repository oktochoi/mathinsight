import type { LessonLog, ReportTone, Student } from '@/types/database';
import { prompts, SYSTEM_INSTRUCTION, type AiPromptTask } from '@/lib/ai/prompts';
import { generateWithGemini, parseBulletList } from '@/lib/ai/gemini';
import {
  getGeminiConfigStatus,
  geminiBackendLabel,
  geminiConfigHint,
  isGeminiConfigured,
} from '@/lib/ai/env';
import { guardAiOutput, sanitizeApiError } from '@/lib/ai/security';
import { TASK_GEMINI_CONFIG } from '@/lib/ai/taskConfig';
import {
  generateLearningSummary,
  generateEvidenceSummary,
  generateConsultationPoints,
  generateParentMessage,
  generateParentReport,
} from '@/lib/reportGenerator';
import { sanitizeParentReportText } from '@/lib/parentReportFormat';

export type AiGenerateInput = {
  task: AiPromptTask;
  logs: LessonLog[];
  student: Pick<Student, 'name' | 'grade'>;
  periodStart: string;
  periodEnd: string;
  academyName: string;
  tone?: ReportTone;
};

export type AiGenerateResult =
  | { ok: true; source: 'gemini'; text: string; points?: string[]; backend?: string }
  | {
      ok: true;
      source: 'rules';
      text: string;
      points?: string[];
      fallbackReason?: string;
    }
  | { ok: false; error: string };

function buildContext(input: AiGenerateInput) {
  return {
    studentName: input.student.name,
    grade: input.student.grade,
    academyName: input.academyName,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    logs: input.logs,
  };
}

function buildUserPrompt(input: AiGenerateInput): string | null {
  const ctx = buildContext(input);
  switch (input.task) {
    case 'learningSummary':
      return prompts.learningSummary(ctx);
    case 'evidenceSummary':
      return prompts.evidenceSummary(ctx);
    case 'consultationPoints':
      return prompts.consultationPoints(ctx);
    case 'parentMessage':
      return prompts.parentMessage(ctx);
    case 'parentReport':
      return prompts.parentReport({ ...ctx, tone: input.tone ?? 'objective' });
    default:
      return null;
  }
}

function fallbackRules(
  input: AiGenerateInput,
  fallbackReason?: string
): Extract<AiGenerateResult, { ok: true; source: 'rules' }> {
  const { task, logs, student, periodStart, periodEnd, academyName, tone } = input;

  switch (task) {
    case 'learningSummary':
      return {
        ok: true,
        source: 'rules',
        text: generateLearningSummary(logs, student.name),
        fallbackReason,
      };
    case 'evidenceSummary':
      return {
        ok: true,
        source: 'rules',
        text: generateEvidenceSummary(logs),
        fallbackReason,
      };
    case 'consultationPoints': {
      const points = generateConsultationPoints(logs);
      return {
        ok: true,
        source: 'rules',
        text: points.join('\n'),
        points,
        fallbackReason,
      };
    }
    case 'parentMessage':
      return {
        ok: true,
        source: 'rules',
        text: generateParentMessage(logs, student.name, academyName),
        fallbackReason,
      };
    case 'parentReport':
      return {
        ok: true,
        source: 'rules',
        text: generateParentReport(
          logs,
          student,
          periodStart,
          periodEnd,
          tone ?? 'objective',
          academyName
        ),
        fallbackReason,
      };
    default:
      return {
        ok: true,
        source: 'rules',
        text: '',
        fallbackReason: '알 수 없는 작업',
      };
  }
}

/** 서버 전용 — Gemini 우선, 실패 시 규칙 기반 폴백 */
export async function runAiGenerate(input: AiGenerateInput): Promise<AiGenerateResult> {
  const configStatus = getGeminiConfigStatus();
  if (!isGeminiConfigured()) {
    return fallbackRules(input, geminiConfigHint(configStatus));
  }

  const userPrompt = buildUserPrompt(input);
  if (!userPrompt) {
    return { ok: false, error: '알 수 없는 작업입니다.' };
  }

  try {
    const cfg = TASK_GEMINI_CONFIG[input.task];
    const { text: rawText, backend } = await generateWithGemini(userPrompt, {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: cfg.temperature,
      maxOutputTokens: cfg.maxOutputTokens,
    });

    const text = guardAiOutput(rawText);
    const backendLabel = geminiBackendLabel(backend);

    if (input.task === 'consultationPoints') {
      const points = parseBulletList(text);
      return { ok: true, source: 'gemini', text, points, backend: backendLabel };
    }

    if (input.task === 'parentReport') {
      const outText = sanitizeParentReportText(text);
      const minLen = 280;
      const hasClosing =
        outText.includes('[맺음말]') || /드림\s*$/m.test(outText);
      const sectionMarkers = (outText.match(/\[[^\]]+\]/g) ?? []).length;
      if (outText.length < minLen || !hasClosing || sectionMarkers < 4) {
        return fallbackRules(
          input,
          outText.length < minLen
            ? 'AI 응답이 중간에 끊겨 규칙 기반으로 다시 작성했습니다.'
            : 'AI 응답 형식이 불완전해 규칙 기반으로 다시 작성했습니다.'
        );
      }
      return { ok: true, source: 'gemini', text: outText, backend: backendLabel };
    }

    return { ok: true, source: 'gemini', text, backend: backendLabel };
  } catch (e) {
    const message = sanitizeApiError(e);
    console.error(`[runAiGenerate] Gemini failed (${input.task}):`, message);
    return fallbackRules(input, `Gemini 호출 실패 → 규칙 기반으로 대체했습니다.`);
  }
}

/** 상담 카드 4종 병렬 생성 */
export async function runAiGenerateBatch(
  input: Omit<AiGenerateInput, 'task'>
): Promise<{
  learningSummary: AiGenerateResult;
  evidenceSummary: AiGenerateResult;
  consultationPoints: AiGenerateResult;
  parentMessage: AiGenerateResult;
}> {
  const [learningSummary, evidenceSummary, consultationPoints, parentMessage] =
    await Promise.all([
      runAiGenerate({ ...input, task: 'learningSummary' }),
      runAiGenerate({ ...input, task: 'evidenceSummary' }),
      runAiGenerate({ ...input, task: 'consultationPoints' }),
      runAiGenerate({ ...input, task: 'parentMessage' }),
    ]);

  return { learningSummary, evidenceSummary, consultationPoints, parentMessage };
}
