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
      const { data: links } = await supabase
        .from('student_connections')
        .select('student_id')
        .eq('user_id', profile.id)
        .in('relationship', ['mother', 'father', 'guardian']);
      const ids = (links ?? []).map((c) => c.student_id as string);
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
      .select('*, students(id, name, grade)')
      .order('created_at', { ascending: false });

    if (profile?.academy_id) {
      query = query.eq('academy_id', profile.academy_id);
    }
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error: err } = await query;
    if (err) {
      setError('리포트를 불러오지 못했습니다.');
      setReports([]);
    } else {
      setReports((data ?? []) as ParentReport[]);
    }
    setLoading(false);
  }, [studentId, profile?.academy_id, profile?.id, profile?.role]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, dataVersion]);

  const saveReport = async (
    payload: Omit<ParentReport, 'id' | 'created_at' | 'students' | 'academy_id'>
  ) => {
    if (!profile?.id) return { error: '로그인 정보가 없습니다.', reportId: undefined };

    let academyId = profile.academy_id ?? null;
    if (!academyId && payload.student_id) {
      const { data: student } = await supabase
        .from('students')
        .select('academy_id')
        .eq('id', payload.student_id)
        .maybeSingle();
      academyId = (student as { academy_id?: string } | null)?.academy_id ?? null;
    }
    if (!academyId) {
      return { error: '학원 정보가 없어 리포트를 저장할 수 없습니다.', reportId: undefined };
    }

    const { data, error: err } = await supabase
      .from('parent_reports')
      .insert({
        ...payload,
        academy_id: academyId,
        generated_by: profile.id,
      })
      .select('id')
      .single();
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null, reportId: data?.id as string | undefined };
  };

  return { reports, loading, error, refetch: fetchReports, saveReport };
}
