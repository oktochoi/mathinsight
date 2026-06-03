'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { parentCanAccessStudent } from '@/lib/portalStudents';
import type { ParentReport } from '@/types/database';

export function useParentReport(id: string | undefined) {
  const { profile } = useAuth();
  const [report, setReport] = useState<ParentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!id) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('parent_reports')
      .select('*, students(id, name, grade, academy_id, parent_user_id)')
      .eq('id', id)
      .maybeSingle();

    if (err || !data) {
      setError('리포트를 불러오지 못했습니다.');
      setReport(null);
      setLoading(false);
      return;
    }

    const row = data as ParentReport;
    const student = row.students as {
      academy_id?: string;
      parent_user_id?: string | null;
    } | null;

    if (profile?.role === 'parent') {
      const allowed = await parentCanAccessStudent(profile.id, row.student_id);
      if (!allowed) {
        setError('이 리포트에 접근할 수 없습니다.');
        setReport(null);
      } else {
        setReport(row);
      }
    } else if (
      profile?.academy_id &&
      student?.academy_id &&
      student.academy_id !== profile.academy_id
    ) {
      setError('이 리포트에 접근할 수 없습니다.');
      setReport(null);
    } else {
      setReport(row);
    }
    setLoading(false);
  }, [id, profile?.academy_id, profile?.id, profile?.role]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { report, loading, error, refetch: fetchReport };
}
