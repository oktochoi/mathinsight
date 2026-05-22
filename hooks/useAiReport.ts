'use client';

import { useCallback, useState } from 'react';
import { fetchAiGenerate, type AiGenerateRequest } from '@/lib/ai/client';

export function useAiReport() {
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'gemini' | 'rules' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (request: AiGenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAiGenerate(request);
      if (!result.ok || !result.text) {
        setError(result.error ?? '생성에 실패했습니다.');
        setSource(null);
        return null;
      }
      setSource(result.source ?? null);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '네트워크 오류';
      setError(msg);
      setSource(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, source, error, clearError: () => setError(null) };
}
