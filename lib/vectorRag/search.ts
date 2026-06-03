import type { SupabaseClient } from '@supabase/supabase-js';
import { embedText } from '@/lib/ai/embeddings';
import { isGeminiConfigured } from '@/lib/ai/env';
import {
  SOURCE_TYPE_LABELS,
  type MemorySourceType,
  type RagCitation,
  type VectorMatchRow,
  type VectorRagResult,
} from '@/lib/vectorRag/types';

function formatVectorContext(
  studentName: string,
  studentId: string,
  matches: VectorMatchRow[]
): string {
  const lines = [
    '=== Vector RAG 검색 결과 (아래 기록만 근거로 사용) ===',
    `학생: ${studentName} (ID: ${studentId})`,
    '',
  ];
  for (const m of matches) {
    lines.push(`[${m.source_type}] ${m.title}`, m.content, '');
  }
  return lines.join('\n');
}

export function buildCitations(matches: VectorMatchRow[]): RagCitation[] {
  const counts = new Map<MemorySourceType, number>();
  for (const m of matches) {
    const t = m.source_type as MemorySourceType;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source_type, count]) => ({
    source_type,
    label: SOURCE_TYPE_LABELS[source_type] ?? source_type,
    count,
  }));
}

export async function vectorSearchStudentMemory(
  supabase: SupabaseClient,
  academyId: string,
  studentId: string,
  studentName: string,
  question: string,
  matchCount = 10
): Promise<VectorRagResult | null> {
  if (!isGeminiConfigured()) return null;

  const { count } = await supabase
    .from('student_memory_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .not('embedding', 'is', null);

  if (!count || count === 0) return null;

  const queryEmbedding = await embedText(question, 'RETRIEVAL_QUERY');

  const { data, error } = await supabase.rpc('match_student_memory_chunks', {
    p_academy_id: academyId,
    p_student_id: studentId,
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error || !data?.length) return null;

  const matches = data as VectorMatchRow[];
  const citations = buildCitations(matches);

  return {
    question: question.trim(),
    contextText: formatVectorContext(studentName, studentId, matches),
    mode: 'vector',
    matches,
    citations,
    meta: { matchCount: matches.length, indexedChunks: count },
  };
}
