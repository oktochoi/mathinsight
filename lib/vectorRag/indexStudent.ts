import type { SupabaseClient } from '@supabase/supabase-js';
import { embedText } from '@/lib/ai/embeddings';
import { isGeminiConfigured } from '@/lib/ai/env';
import { buildStudentMemoryChunks } from '@/lib/vectorRag/chunkBuilder';
import { logAgentRun } from '@/lib/agents/log';

export async function indexStudentMemory(
  supabase: SupabaseClient,
  studentId: string,
  options?: { skipEmbeddings?: boolean }
): Promise<
  | { ok: true; chunkCount: number; embeddedCount: number }
  | { ok: false; error: string }
> {
  const built = await buildStudentMemoryChunks(supabase, studentId);
  if (!built) {
    return { ok: false, error: '학생 데이터를 불러오지 못했습니다.' };
  }

  const { academyId, drafts } = built;

  await supabase.from('student_memory_chunks').delete().eq('student_id', studentId);

  if (drafts.length === 0) {
    return { ok: true, chunkCount: 0, embeddedCount: 0 };
  }

  const canEmbed = isGeminiConfigured() && !options?.skipEmbeddings;
  let embeddedCount = 0;
  const rows: Record<string, unknown>[] = [];

  for (const draft of drafts) {
    let embedding: number[] | null = null;
    if (canEmbed) {
      try {
        embedding = await embedText(draft.content, 'RETRIEVAL_DOCUMENT');
        embeddedCount += 1;
      } catch {
        embedding = null;
      }
    }
    rows.push({
      academy_id: academyId,
      student_id: studentId,
      source_type: draft.source_type,
      source_id: draft.source_id,
      title: draft.title,
      content: draft.content,
      embedding,
      metadata: draft.metadata ?? {},
    });
  }

  const { error: insErr } = await supabase.from('student_memory_chunks').insert(rows);
  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  await logAgentRun(supabase, {
    academyId,
    agentType: 'parent_rag',
    studentId,
    status: 'completed',
    action: 'vector_index',
    result: { chunkCount: drafts.length, embeddedCount },
  });

  return { ok: true, chunkCount: drafts.length, embeddedCount };
}
