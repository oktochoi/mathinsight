'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { upsertLessonLogs } from '@/lib/lessonLogUpsert';
import { fetchLessonLogs } from '@/lib/lessonLogsRead';
import { supabase } from '@/lib/supabase';
import type { LessonLog, LessonLogInsert } from '@/types/database';

export function useLessonLogs(filters?: {
  studentId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!profile) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const academyId =
      profile.academy_id && (profile.role === 'owner' || profile.role === 'teacher')
        ? profile.academy_id
        : undefined;

    const { logs: rows, error: err } = await fetchLessonLogs({
      academyId,
      studentId: filters?.studentId,
      classId: filters?.classId,
      fromDate: filters?.fromDate,
      toDate: filters?.toDate,
      limit: filters?.limit,
    });

    if (err) {
      setError('수업 기록을 불러오지 못했습니다.');
      setLogs([]);
    } else {
      setLogs(rows);
    }
    setLoading(false);
  }, [
    profile?.academy_id,
    profile?.role,
    profile,
    filters?.studentId,
    filters?.classId,
    filters?.fromDate,
    filters?.toDate,
    filters?.limit,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, dataVersion]);

  const batchInsert = async (rows: LessonLogInsert[]) => {
    if (rows.length === 0) return { error: '저장할 기록이 없습니다.' };
    const result = await upsertLessonLogs(supabase, rows);
    if (!result.error) bumpDataVersion();
    return result;
  };

  const upsertLogs = batchInsert;

  return { logs, loading, error, refetch: fetchLogs, batchInsert, upsertLogs };
}

export { useClasses } from '@/hooks/useClasses';
