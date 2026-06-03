export type MemorySourceType =
  | 'student_profile'
  | 'lesson_log'
  | 'consultation_card'
  | 'parent_report'
  | 'risk_signal'
  | 'schedule'
  | 'memo'
  | 'tag';

export interface MemoryChunkDraft {
  source_type: MemorySourceType;
  source_id: string | null;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface VectorMatchRow {
  id: string;
  content: string;
  source_type: MemorySourceType;
  source_id: string | null;
  title: string;
  similarity: number;
}

export interface RagCitation {
  source_type: MemorySourceType;
  label: string;
  count: number;
}

export interface VectorRagResult {
  question: string;
  contextText: string;
  mode: 'vector' | 'keyword';
  matches: VectorMatchRow[];
  citations: RagCitation[];
  meta: {
    matchCount: number;
    indexedChunks?: number;
  };
}

export const SOURCE_TYPE_LABELS: Record<MemorySourceType, string> = {
  student_profile: '학생 프로필',
  lesson_log: '수업 기록',
  consultation_card: '상담 카드',
  parent_report: '학부모 리포트',
  risk_signal: '위험 신호',
  schedule: '수업 일정',
  memo: '수업 메모',
  tag: '학습 태그',
};
