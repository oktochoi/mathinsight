import { getGeminiApiKey } from '@/lib/ai/env';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;

export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

type EmbedResponse = {
  embedding?: { values?: number[] };
  error?: { message?: string };
};

export function getEmbeddingDimension(): number {
  return EMBEDDING_DIM;
}

export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const trimmed = text.trim().slice(0, 8000);
  if (!trimmed) {
    throw new Error('임베딩할 텍스트가 비어 있습니다.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text: trimmed }] },
      taskType,
      outputDimensionality: EMBEDDING_DIM,
    }),
  });

  const data = (await res.json()) as EmbedResponse;
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Embedding API 오류 (${res.status})`);
  }

  const values = data.embedding?.values;
  if (!values?.length) {
    throw new Error('임베딩 벡터가 비어 있습니다.');
  }

  return values;
}
