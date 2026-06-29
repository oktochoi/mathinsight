'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { Exam, ExamScore } from '@/types/database';

export function useExams(classId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    if (!profile?.academy_id) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from('exams')
      .select('*, classes(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('exam_date', { ascending: false })
      .limit(50);
    if (classId) q = q.eq('class_id', classId);
    const { data, error: err } = await q;
    if (err) {
      setError('시험 목록을 불러오지 못했습니다.');
      setExams([]);
    } else {
      setExams((data ?? []) as Exam[]);
    }
    setLoading(false);
  }, [profile?.academy_id, classId]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams, dataVersion]);

  const createExam = async (input: {
    class_id: string;
    name: string;
    subject?: string;
    unit_scope?: string;
    exam_date: string;
    max_score?: number;
  }) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };
    const { data, error: err } = await supabase
      .from('exams')
      .insert({
        academy_id: profile.academy_id,
        class_id: input.class_id,
        name: input.name,
        subject: input.subject ?? '수학',
        unit_scope: input.unit_scope ?? null,
        exam_date: input.exam_date,
        max_score: input.max_score ?? 100,
        created_by: profile.id,
      })
      .select('id')
      .single();
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null, examId: data?.id as string };
  };

  const fetchScores = async (examId: string) => {
    const { data, error: err } = await supabase
      .from('exam_scores')
      .select('*, students(id, name, grade)')
      .eq('exam_id', examId);
    if (err) return { scores: [] as ExamScore[], error: err.message };
    return { scores: (data ?? []) as ExamScore[], error: null };
  };

  const saveScores = async (
    examId: string,
    rows: { student_id: string; score: number | null; feedback_memo?: string }[]
  ) => {
    if (rows.length === 0) return { error: null };
    const payload = rows.map((r) => ({
      exam_id: examId,
      student_id: r.student_id,
      score: r.score,
      feedback_memo: r.feedback_memo ?? null,
    }));
    const { error: err } = await supabase
      .from('exam_scores')
      .upsert(payload, { onConflict: 'exam_id,student_id' });
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  return {
    exams,
    loading,
    error,
    refetch: fetchExams,
    createExam,
    fetchScores,
    saveScores,
  };
}
