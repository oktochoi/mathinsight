import type { RagCitation } from '@/lib/vectorRag/types';

export type RagChunkSource =
  | 'student_profile'
  | 'scores'
  | 'homework'
  | 'attendance'
  | 'consultation'
  | 'consultation_card'
  | 'parent_report'
  | 'tags'
  | 'memo'
  | 'schedule';

export interface RagChunk {
  id: string;
  source: RagChunkSource;
  text: string;
  date?: string;
  keywords: string[];
}

export interface RagRetrievalResult {
  question: string;
  intents: RagChunkSource[];
  selectedChunks: RagChunk[];
  contextText: string;
  mode?: 'vector' | 'keyword';
  citations?: RagCitation[];
  meta: {
    totalChunks: number;
    selectedCount: number;
    sources: RagChunkSource[];
  };
}
