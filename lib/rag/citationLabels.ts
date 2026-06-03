import type { RagCitation } from '@/lib/vectorRag/types';
import type { MemorySourceType } from '@/lib/vectorRag/types';
import { SOURCE_TYPE_LABELS } from '@/lib/vectorRag/types';
import type { RagChunkSource } from '@/lib/rag/types';

const KEYWORD_SOURCE_MAP: Record<
  string,
  { source_type: MemorySourceType; label: string }
> = {
  student_profile: { source_type: 'student_profile', label: '학생 프로필' },
  scores: { source_type: 'lesson_log', label: '시험·점수' },
  homework: { source_type: 'lesson_log', label: '숙제' },
  attendance: { source_type: 'lesson_log', label: '출결' },
  consultation: { source_type: 'consultation_card', label: '상담' },
  consultation_card: { source_type: 'consultation_card', label: '상담 카드' },
  parent_report: { source_type: 'parent_report', label: '학부모 리포트' },
  tags: { source_type: 'tag', label: '학습 태그' },
  memo: { source_type: 'memo', label: '수업 메모' },
  schedule: { source_type: 'schedule', label: '수업 일정' },
};

export function keywordChunkCitationMeta(source: RagChunkSource | string): {
  source_type: MemorySourceType;
  label: string;
} {
  const mapped = KEYWORD_SOURCE_MAP[source];
  if (mapped) return mapped;
  const label =
    SOURCE_TYPE_LABELS[source as MemorySourceType] ?? String(source);
  return { source_type: 'lesson_log', label };
}

/** UI 표시용 — 동일 라벨·유형 병합 */
export function mergeCitationsForDisplay(citations: RagCitation[]): RagCitation[] {
  const byLabel = new Map<string, RagCitation>();
  for (const c of citations) {
    const prev = byLabel.get(c.label);
    if (prev) {
      byLabel.set(c.label, { ...prev, count: prev.count + c.count });
    } else {
      byLabel.set(c.label, { ...c });
    }
  }
  return [...byLabel.values()];
}

export function buildKeywordCitations(chunks: { source: string }[]): RagCitation[] {
  const counts = new Map<string, number>();
  for (const c of chunks) {
    counts.set(c.source, (counts.get(c.source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => {
    const meta = keywordChunkCitationMeta(source);
    return {
      source_type: meta.source_type,
      label: meta.label,
      count,
    };
  });
}
