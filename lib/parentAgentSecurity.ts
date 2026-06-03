import type { ParentAgentChatMessage } from '@/lib/parentAgent';

const MAX_HISTORY_TURNS = 4;
const MAX_MESSAGE_CHARS = 600;

/** 클라이언트 대화 기록 — 길이·턴 수만 제한 (학생 ID는 API에서 고정) */
export function sanitizeParentAgentHistory(
  history: unknown
): ParentAgentChatMessage[] {
  if (!Array.isArray(history)) return [];

  const cleaned: ParentAgentChatMessage[] = [];
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: string }).role;
    const content = (item as { content?: string }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string' || !content.trim()) continue;
    cleaned.push({
      role,
      content: content.trim().slice(0, MAX_MESSAGE_CHARS),
    });
  }

  return cleaned.slice(-MAX_HISTORY_TURNS * 2);
}
