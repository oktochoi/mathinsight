import type { SupabaseClient } from '@supabase/supabase-js';
import { chunkMatchesIntent, routeQuestionIntent } from '@/lib/rag/intent';
import { gatherStudentRagChunks } from '@/lib/rag/gather';
import { buildCitations } from '@/lib/vectorRag/search';
import { vectorSearchStudentMemory } from '@/lib/vectorRag/search';
import { indexStudentMemory } from '@/lib/vectorRag/indexStudent';
import type { RagRetrievalResult } from '@/lib/rag/types';
import { buildKeywordCitations } from '@/lib/rag/citationLabels';

const MAX_SELECTED = 14;

async function isStaffIndexer(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = data?.role as string | undefined;
  return role === 'owner' || role === 'teacher';
}

function tokenizeQuestion(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreChunk(
  text: string,
  keywords: string[],
  tokens: string[]
): number {
  let score = 0;
  const hay = `${text} ${keywords.join(' ')}`.toLowerCase();
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  for (const k of keywords) {
    if (tokens.some((t) => k.toLowerCase().includes(t) || t.includes(k.toLowerCase()))) {
      score += 1;
    }
  }
  return score;
}

function formatRagContext(
  studentName: string,
  studentId: string,
  selected: { source: string; text: string }[]
): string {
  const lines = [
    '=== RAG 검색 결과 (키워드, 아래 블록만 근거로 사용) ===',
    `학생: ${studentName} (ID: ${studentId})`,
    '※ 다른 학생 데이터는 포함되지 않았습니다.',
    '',
  ];
  for (const chunk of selected) {
    lines.push(`[${chunk.source}]`, chunk.text, '');
  }
  return lines.join('\n');
}

async function retrieveKeyword(
  supabase: SupabaseClient,
  studentId: string,
  question: string
): Promise<RagRetrievalResult | null> {
  const gathered = await gatherStudentRagChunks(supabase, studentId);
  if (!gathered) return null;

  const { chunks, student } = gathered;
  const intents = routeQuestionIntent(question);
  const tokens = tokenizeQuestion(question);

  const pool = chunks.filter((c) => chunkMatchesIntent(c.source, intents));
  const profile = chunks.find((c) => c.source === 'student_profile');
  const scored = pool
    .filter((c) => c.source !== 'student_profile')
    .map((c) => ({
      chunk: c,
      score: scoreChunk(c.text, c.keywords, tokens) + (c.date ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const selected = [
    ...(profile ? [profile] : []),
    ...scored.slice(0, MAX_SELECTED).map((s) => s.chunk),
  ];

  const unique = new Map<string, (typeof selected)[0]>();
  for (const c of selected) {
    unique.set(c.id, c);
  }
  const finalChunks = [...unique.values()];

  const contextText = formatRagContext(
    student.name,
    studentId,
    finalChunks.map((c) => ({ source: c.source, text: c.text }))
  );

  return {
    question: question.trim(),
    intents,
    selectedChunks: finalChunks,
    contextText,
    mode: 'keyword',
    citations: buildKeywordCitations(finalChunks),
    meta: {
      totalChunks: chunks.length,
      selectedCount: finalChunks.length,
      sources: [...new Set(finalChunks.map((c) => c.source))],
    },
  };
}

/**
 * Vector RAG 우선 → 실패 시 키워드 RAG
 */
export async function retrieveStudentRagContext(
  supabase: SupabaseClient,
  studentId: string,
  question: string
): Promise<RagRetrievalResult | null> {
  const { data: st } = await supabase
    .from('students')
    .select('name, academy_id')
    .eq('id', studentId)
    .maybeSingle();

  if (!st?.academy_id) return retrieveKeyword(supabase, studentId, question);

  const academyId = st.academy_id as string;
  const studentName = (st.name as string) ?? '학생';

  const { count } = await supabase
    .from('student_memory_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId);

  if ((!count || count === 0) && (await isStaffIndexer(supabase))) {
    await indexStudentMemory(supabase, studentId);
  }

  try {
    const vector = await vectorSearchStudentMemory(
      supabase,
      academyId,
      studentId,
      studentName,
      question,
      12
    );
    if (vector) {
      return {
        question: vector.question,
        intents: routeQuestionIntent(question),
        selectedChunks: [],
        contextText: vector.contextText,
        mode: 'vector',
        citations: vector.citations,
        meta: {
          totalChunks: vector.meta.indexedChunks ?? 0,
          selectedCount: vector.meta.matchCount,
          sources: vector.citations.map(
            (c) => c.source_type
          ) as RagRetrievalResult['meta']['sources'],
        },
      };
    }
  } catch (e) {
    console.warn('[rag] vector search fallback:', e);
  }

  const keyword = await retrieveKeyword(supabase, studentId, question);
  if (keyword) {
    return { ...keyword, mode: 'keyword' };
  }
  return null;
}

export { buildCitations };
