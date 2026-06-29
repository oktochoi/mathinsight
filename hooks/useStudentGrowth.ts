'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { fetchLatestRetentionSnapshots, fetchReregistrationRecords } from '@/lib/retentionData';
import { computeStudentGrowth, type StudentGrowthMetrics } from '@/lib/studentGrowth';
import type { ConsultationCard, CounselingSession, LessonLog, Student } from '@/types/database';

export function useStudentGrowth() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [metrics, setMetrics] = useState<StudentGrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.academy_id) {
      setMetrics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const academyId = profile.academy_id;

    const [studentsRes, logsRes, classesRes, counselingRes, cardsRes, retentionRet, reregRet, usersRes] =
      await Promise.all([
        supabase.from('students').select('*').eq('academy_id', academyId),
        supabase
          .from('lesson_logs')
          .select('student_id, lesson_date')
          .eq('academy_id', academyId)
          .order('lesson_date', { ascending: false })
          .limit(800),
        supabase.from('classes').select('id, name, grade, teacher_id').eq('academy_id', academyId),
        supabase
          .from('counseling_sessions')
          .select('student_id, status')
          .eq('academy_id', academyId)
          .limit(200),
        (async () => {
          const { data: sts } = await supabase.from('students').select('id').eq('academy_id', academyId);
          const ids = (sts ?? []).map((s) => s.id);
          if (!ids.length) return { data: [] };
          return supabase
            .from('consultation_cards')
            .select('student_id, consultation_status')
            .in('student_id', ids)
            .limit(200);
        })(),
        fetchLatestRetentionSnapshots(academyId),
        fetchReregistrationRecords(academyId),
        supabase.from('users').select('id, name').eq('academy_id', academyId),
      ]);

    if (studentsRes.error) {
      setError('학생 성장 데이터를 불러오지 못했습니다.');
      setLoading(false);
      return;
    }

    const teacherNames = new Map<string, string>();
    for (const row of (usersRes.data ?? []) as { id: string; name?: string }[]) {
      if (row.id && row.name) teacherNames.set(row.id, row.name);
    }

    const computed = computeStudentGrowth({
      students: (studentsRes.data ?? []) as Student[],
      logs: (logsRes.data ?? []) as LessonLog[],
      reregistrationRecords: reregRet.records,
      retentionSignals: retentionRet.signals,
      counselingSessions: (counselingRes.data ?? []) as Pick<
        CounselingSession,
        'student_id' | 'status'
      >[],
      consultationCards: (cardsRes.data ?? []) as Pick<
        ConsultationCard,
        'student_id' | 'consultation_status'
      >[],
      classes: (classesRes.data ?? []) as {
        id: string;
        name: string;
        grade: string;
        teacher_id: string | null;
      }[],
      teacherNames,
    });

    setMetrics(computed);
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  return { metrics, loading, error, refetch: load };
}
