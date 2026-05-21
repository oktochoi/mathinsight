'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { ParentReport } from '@/types/database';

export function useParentReports(studentId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [reports, setReports] = useState<ParentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (profile?.role === 'parent') {
      const { data: children } = await supabase
        .from('students')
        .select('id')
        .eq('parent_user_id', profile.id);
      const ids = (children ?? []).map((c) => c.id);
      if (ids.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }
      let query = supabase
        .from('parent_reports')
        .select('*, students(id, name, grade)')
        .in('student_id', ids)
        .order('created_at', { ascending: false });
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error: err } = await query;
      if (err) setError('리포트를 불러오지 못했습니다.');
      else setReports((data ?? []) as ParentReport[]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('parent_reports')
      .select('*, students(id, name, grade, academy_id)')
      .order('created_at', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error: err } = await query;
    if (err) {
      setError('리포트를 불러오지 못했습니다.');
      setReports([]);
    } else {
      let list = (data ?? []) as ParentReport[];
      if (profile?.academy_id) {
        list = list.filter(
          (r) =>
            (r.students as { academy_id?: string })?.academy_id === profile.academy_id
        );
      }
      setReports(list);
    }
    setLoading(false);
  }, [studentId, profile?.academy_id, profile?.id, profile?.role]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, dataVersion]);

  const saveReport = async (
    payload: Omit<ParentReport, 'id' | 'created_at' | 'students'>
  ) => {
    const { error: err } = await supabase.from('parent_reports').insert({
      ...payload,
      generated_by: profile?.id ?? null,
    });
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  return { reports, loading, error, refetch: fetchReports, saveReport };
}
