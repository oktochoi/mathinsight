'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import {
  fetchLatestRetentionSnapshots,
  fetchReregistrationRecords,
} from '@/lib/retentionData';
import type { RetentionRiskLevel, RetentionSignal, ReregistrationRecord } from '@/types/database';

export function useRetention() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [signals, setSignals] = useState<RetentionSignal[]>([]);
  const [records, setRecords] = useState<ReregistrationRecord[]>([]);
  const [dataSource, setDataSource] = useState<'snapshots' | 'legacy'>('legacy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchSignals = useCallback(async () => {
    if (!profile?.academy_id) {
      setSignals([]);
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [ret, rereg] = await Promise.all([
      fetchLatestRetentionSnapshots(profile.academy_id),
      fetchReregistrationRecords(profile.academy_id),
    ]);

    if (ret.signals.length === 0 && ret.source === 'legacy') {
      setError(null);
    }
    setSignals(ret.signals);
    setDataSource(ret.source);
    setRecords(rereg.records);
    if (rereg.error) setError(rereg.error);
    else setError(null);
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals, dataVersion]);

  const runScan = async () => {
    setScanning(true);
    const res = await fetch('/api/retention/scan', { method: 'POST' });
    const json = (await res.json()) as { ok: boolean; error?: string; scanned?: number };
    setScanning(false);
    if (!json.ok) return { error: json.error ?? '스캔에 실패했습니다.' };
    bumpDataVersion();
    return { error: null, scanned: json.scanned ?? 0 };
  };

  const highRiskCount = signals.filter((s) => s.risk_level === 'high').length;
  const mediumRiskCount = signals.filter((s) => s.risk_level === 'medium').length;

  return {
    signals,
    records,
    dataSource,
    loading,
    error,
    scanning,
    highRiskCount,
    mediumRiskCount,
    refetch: fetchSignals,
    runScan,
  };
}

export function usePortalRetention(studentId?: string) {
  const [signal, setSignal] = useState<RetentionSignal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setSignal(null);
      return;
    }
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from('student_risk_snapshots')
        .select('*')
        .eq('student_id', studentId)
        .eq('snapshot_type', 'retention')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const row = data as {
          id: string;
          academy_id: string;
          student_id: string;
          risk_level: string;
          score: number;
          reason: string;
          signals: { id: string; label: string }[];
          created_at: string;
        };
        setSignal({
          id: row.id,
          academy_id: row.academy_id,
          student_id: row.student_id,
          risk_level: row.risk_level as RetentionRiskLevel,
          score: row.score,
          reason: row.reason,
          signals: row.signals,
          created_at: row.created_at,
        });
        setLoading(false);
        return;
      }

      const legacy = await supabase
        .from('retention_signals')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSignal((legacy.data as RetentionSignal) ?? null);
      setLoading(false);
    })();
  }, [studentId]);

  return { signal, loading };
}

export const RETENTION_RISK_STYLES: Record<RetentionRiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-50 text-amber-900 border-amber-200',
  high: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const REREGISTRATION_STATUS_LABELS: Record<string, string> = {
  pending: '연락 대기',
  contacted: '연락 완료',
  confirmed: '재등록 확정',
  declined: '이탈',
  deferred: '보류',
};
