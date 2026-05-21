'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { deriveStudentStatus } from '@/lib/analytics';
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

    let query = supabase
      .from('lesson_logs')
      .select('*, students(id, name, grade)')
      .order('lesson_date', { ascending: false });

    if (
      profile.academy_id &&
      (profile.role === 'admin' || profile.role === 'teacher')
    ) {
      query = query.eq('academy_id', profile.academy_id);
    }
    if (filters?.studentId) query = query.eq('student_id', filters.studentId);
    if (filters?.classId) query = query.eq('class_id', filters.classId);
    if (filters?.fromDate) query = query.gte('lesson_date', filters.fromDate);
    if (filters?.toDate) query = query.lte('lesson_date', filters.toDate);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error: err } = await query;
    if (err) {
      setError('수업 기록을 불러오지 못했습니다.');
      setLogs([]);
    } else {
      setLogs((data ?? []) as LessonLog[]);
    }
    setLoading(false);
  }, [
    profile?.academy_id,
    profile?.role,
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
    const { error: err } = await supabase.from('lesson_logs').insert(rows);
    if (err) return { error: err.message };

    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    for (const sid of studentIds) {
      const { data: recent } = await supabase
        .from('lesson_logs')
        .select('*')
        .eq('student_id', sid)
        .order('lesson_date', { ascending: false })
        .limit(12);
      const status = deriveStudentStatus((recent ?? []) as LessonLog[]);
      await supabase.from('students').update({ status }).eq('id', sid);
    }

    bumpDataVersion();
    return { error: null };
  };

  return { logs, loading, error, refetch: fetchLogs, batchInsert };
}

export { useClasses } from '@/hooks/useClasses';
