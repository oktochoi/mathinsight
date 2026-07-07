import type { AiPromptTask } from '@/lib/ai/prompts';

export type TaskGeminiConfig = {
  temperature: number;
  maxOutputTokens: number;
};

export const TASK_GEMINI_CONFIG: Record<AiPromptTask, TaskGeminiConfig> = {
  learningSummary: { temperature: 0.42, maxOutputTokens: 1536 },
  evidenceSummary: { temperature: 0.22, maxOutputTokens: 2048 },
  consultationPoints: { temperature: 0.38, maxOutputTokens: 1024 },
  parentMessage: { temperature: 0.48, maxOutputTokens: 1024 },
  parentReport: { temperature: 0.4, maxOutputTokens: 8192 },
  messageDraft: { temperature: 0.45, maxOutputTokens: 1024 },
  counselingSummary: { temperature: 0.32, maxOutputTokens: 1536 },
};

export const CONSULTATION_CARD_TASKS = [
  'learningSummary',
  'evidenceSummary',
  'consultationPoints',
  'parentMessage',
] as const satisfies readonly AiPromptTask[];
