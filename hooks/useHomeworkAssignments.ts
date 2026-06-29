'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { upsertLessonLogs } from '@/lib/lessonLogUpsert';
import type { HomeworkAssignment, HomeworkStatus, HomeworkSubmission, LessonLogInsert } from '@/types/database';

export function useHomeworkAssignments(classId?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!profile?.academy_id) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from('homework_assignments')
      .select('*, classes(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('due_date', { ascending: false })
      .limit(40);
    if (classId) q = q.eq('class_id', classId);
    const { data, error: err } = await q;
    if (err) {
      setError('숙제 목록을 불러오지 못했습니다.');
      setAssignments([]);
    } else {
      setAssignments((data ?? []) as HomeworkAssignment[]);
    }
    setLoading(false);
  }, [profile?.academy_id, classId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, dataVersion]);

  const createAssignment = async (input: {
    class_id: string;
    title: string;
    description?: string;
    due_date: string;
    lesson_date?: string;
    unit?: string;
    studentIds: string[];
  }) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };
    const { data: hw, error: hwErr } = await supabase
      .from('homework_assignments')
      .insert({
        academy_id: profile.academy_id,
        class_id: input.class_id,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date,
        lesson_date: input.lesson_date ?? input.due_date,
        unit: input.unit ?? null,
        created_by: profile.id,
      })
      .select('id')
      .single();
    if (hwErr || !hw) return { error: hwErr?.message ?? '숙제 등록 실패' };

    const subs = input.studentIds.map((sid) => ({
      assignment_id: hw.id,
      student_id: sid,
      status: 'missing' as HomeworkStatus,
    }));
    const { error: subErr } = await supabase.from('homework_submissions').insert(subs);
    if (subErr) return { error: subErr.message };

    bumpDataVersion();
    return { error: null, assignmentId: hw.id as string };
  };

  const fetchSubmissions = async (assignmentId: string) => {
    const { data, error: err } = await supabase
      .from('homework_submissions')
      .select('*, students(id, name, grade)')
      .eq('assignment_id', assignmentId);
    if (err) return { submissions: [] as HomeworkSubmission[], error: err.message };
    return { submissions: (data ?? []) as HomeworkSubmission[], error: null };
  };

  const saveSubmissions = async (
    assignment: HomeworkAssignment,
    rows: { student_id: string; status: HomeworkStatus; feedback_memo?: string }[]
  ) => {
    if (!profile?.academy_id || !profile.id) return { error: '로그인 정보가 없습니다.' };

    for (const row of rows) {
      await supabase
        .from('homework_submissions')
        .update({
          status: row.status,
          feedback_memo: row.feedback_memo ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('assignment_id', assignment.id)
        .eq('student_id', row.student_id);
    }

    const lessonDate = assignment.lesson_date ?? assignment.due_date;
    const lessonRows: LessonLogInsert[] = rows.map((row) => ({
      academy_id: profile.academy_id!,
      class_id: assignment.class_id,
      student_id: row.student_id,
      teacher_id: profile.id,
      lesson_date: lessonDate,
      unit: assignment.unit ?? assignment.title,
      attendance_status: 'present',
      homework_status: row.status,
      test_score: null,
      tags: ['숙제'],
      memo: row.feedback_memo ?? null,
    }));
    const sync = await upsertLessonLogs(supabase, lessonRows);
    if (sync.error) return sync;

    bumpDataVersion();
    return { error: null };
  };

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    createAssignment,
    fetchSubmissions,
    saveSubmissions,
  };
}
