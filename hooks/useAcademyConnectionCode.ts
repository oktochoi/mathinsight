'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';

export function useAcademyConnectionCode() {
  const { academy, refresh } = useAuth();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  const regenerate = useCallback(async () => {
    if (!academy?.id) return { error: '학원 정보가 없습니다.', code: null as string | null };

    const { data, error: rpcError } = await supabase.rpc('regenerate_academy_connection_code', {
      p_academy_id: academy.id,
    });
    const result = data as { ok?: boolean; connection_code?: string; error?: string } | null;
    if (rpcError || !result?.ok) {
      return { error: result?.error ?? rpcError?.message ?? '재발급 실패', code: null };
    }
    bumpDataVersion();
    await refresh();
    return { error: null, code: result.connection_code ?? null };
  }, [academy?.id, bumpDataVersion, refresh]);

  return {
    code: academy?.connection_code ?? null,
    academyName: academy?.name ?? null,
    regenerate,
  };
}
