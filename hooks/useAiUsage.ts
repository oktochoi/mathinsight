'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isStaffRole } from '@/lib/roles';

type AiUsageState = {
  used: number;
  quota: number;
  loading: boolean;
};

export function useAiUsage() {
  const { profile } = useAuth();
  const [state, setState] = useState<AiUsageState>({ used: 0, quota: 0, loading: true });

  const refetch = useCallback(async () => {
    if (!profile?.academy_id || !profile.role || !isStaffRole(profile.role)) {
      setState({ used: 0, quota: 0, loading: false });
      return;
    }
    try {
      const res = await fetch('/api/ai/usage');
      const data = (await res.json()) as { ok?: boolean; used?: number; quota?: number };
      if (data.ok) {
        setState({ used: data.used ?? 0, quota: data.quota ?? 0, loading: false });
        return;
      }
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...s, loading: false }));
  }, [profile?.academy_id, profile?.role]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { ...state, refetch };
}
