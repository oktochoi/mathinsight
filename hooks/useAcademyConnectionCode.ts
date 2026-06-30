'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';

export function useAcademyConnectionCode() {
  const { academy, refresh } = useAuth();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  const publicCode =
    (academy as { academy_code?: string } | null)?.academy_code ?? academy?.connection_code ?? null;
  const legacyCode = academy?.connection_code ?? null;
  const codeIssuedAt =
    (academy as { academy_code_issued_at?: string } | null)?.academy_code_issued_at ??
    academy?.created_at ??
    null;

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

  const regeneratePublicCode = useCallback(async () => {
    if (!academy?.id) return { error: '학원 정보가 없습니다.', code: null as string | null };

    const { data, error: rpcError } = await supabase.rpc('regenerate_academy_public_code', {
      p_academy_id: academy.id,
    });
    const result = data as { ok?: boolean; academy_code?: string; error?: string } | null;
    if (rpcError || !result?.ok) {
      return { error: result?.error ?? rpcError?.message ?? '재발급 실패', code: null };
    }
    bumpDataVersion();
    await refresh();
    return { error: null, code: result.academy_code ?? null };
  }, [academy?.id, bumpDataVersion, refresh]);

  return {
    code: publicCode,
    publicCode,
    legacyCode,
    codeIssuedAt,
    academyName: academy?.name ?? null,
    regenerate,
    regeneratePublicCode,
  };
}
