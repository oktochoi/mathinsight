'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { StudentRiskSnapshot } from '@/types/database';

export type CounselingTarget = {
  studentId: string;
  name: string;
  grade: string;
  snapshotType: string;
  riskLevel: string;
  reason: string;
  score: number;
};

/** 상담센터 prep — 위험 스냅샷 기반 상담 대상 */
export function useCounselingTargets() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [targets, setTargets] = useState<CounselingTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.academy_id) {
      setTargets([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from('student_risk_snapshots')
      .select('*, students(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .in('risk_level', ['high', 'medium', 'consultation', 'attention'])
      .order('created_at', { ascending: false })
      .limit(200);

    const rows = (data ?? []) as (StudentRiskSnapshot & {
      students?: { id: string; name: string; grade: string } | null;
    })[];

    const latest = new Map<string, CounselingTarget>();
    for (const row of rows) {
      const key = `${row.student_id}:${row.snapshot_type}`;
      if (latest.has(key)) continue;
      latest.set(key, {
        studentId: row.student_id,
        name: row.students?.name ?? '학생',
        grade: row.students?.grade ?? '',
        snapshotType: row.snapshot_type,
        riskLevel: row.risk_level,
        reason: row.reason,
        score: row.score,
      });
    }

    const list = [...latest.values()].sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, consultation: 2, attention: 3 };
      return (order[a.riskLevel] ?? 9) - (order[b.riskLevel] ?? 9) || b.score - a.score;
    });

    if (list.length === 0) {
      const legacy = await supabase
        .from('retention_signals')
        .select('*, students(id, name, grade)')
        .eq('academy_id', profile.academy_id)
        .in('risk_level', ['high', 'medium'])
        .order('created_at', { ascending: false })
        .limit(50);
      const seen = new Set<string>();
      for (const row of (legacy.data ?? []) as {
        student_id: string;
        risk_level: string;
        reason: string;
        score: number;
        students?: { name?: string; grade?: string };
      }[]) {
        if (seen.has(row.student_id)) continue;
        seen.add(row.student_id);
        list.push({
          studentId: row.student_id,
          name: row.students?.name ?? '학생',
          grade: row.students?.grade ?? '',
          snapshotType: 'retention',
          riskLevel: row.risk_level,
          reason: row.reason,
          score: row.score,
        });
      }
    }

    setTargets(list.slice(0, 12));
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  return { targets, loading, refetch: load };
}
