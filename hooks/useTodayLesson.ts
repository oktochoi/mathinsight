'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { AttendanceStatus, HomeworkStatus, LessonRow } from '@/types/database';

export type TodayLessonStudentRow = {
  studentId: string;
  name: string;
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  score: string;
  tags: string[];
  note: string;
};

export function useTodayLesson(classId: string, lessonDate: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!classId || !lessonDate || !profile?.academy_id) {
      setLesson(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('lessons')
      .select('*, classes(id, name, grade)')
      .eq('class_id', classId)
      .eq('lesson_date', lessonDate)
      .maybeSingle();

    if (err) {
      setError('수업 정보를 불러오지 못했습니다.');
      setLesson(null);
    } else {
      setLesson((data as LessonRow | null) ?? null);
    }
    setLoading(false);
  }, [classId, lessonDate, profile?.academy_id]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  const closeLesson = async () => {
    if (!lesson?.id || !profile?.id) return { error: '마감할 수업이 없습니다.' };
    const { error: err } = await supabase
      .from('lessons')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lesson.id);
    if (err) return { error: err.message };
    bumpDataVersion();
    await load();
    return { error: null };
  };

  const startLesson = async () => {
    if (!lesson?.id) return { error: '수업이 없습니다. 저장 후 다시 시도하세요.' };
    if (!profile?.id) return { error: '로그인 정보가 없습니다.' };
    const now = new Date().toISOString();
    const { error: err } = await supabase
      .from('lessons')
      .update({
        status: 'in_progress',
        started_at: now,
        started_by: profile.id,
        updated_at: now,
      })
      .eq('id', lesson.id);
    if (err) return { error: err.message };
    bumpDataVersion();
    await load();
    return { error: null };
  };

  const reopenLesson = async () => {
    if (!lesson?.id) return { error: '수업이 없습니다.' };
    const { error: err } = await supabase
      .from('lessons')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', lesson.id);
    if (err) return { error: err.message };
    bumpDataVersion();
    await load();
    return { error: null };
  };

  return { lesson, loading, error, refetch: load, closeLesson, startLesson, reopenLesson };
}

/** lesson + attendance + scores + lesson_logs 병합 행 */
export async function loadTodayLessonRows(
  classId: string,
  lessonDate: string,
  studentIds: string[]
): Promise<Record<string, TodayLessonStudentRow>> {
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('class_id', classId)
    .eq('lesson_date', lessonDate)
    .maybeSingle();

  const lessonId = (lesson as { id?: string } | null)?.id;
  const rows: Record<string, TodayLessonStudentRow> = {};

  const defaults = (id: string, name: string): TodayLessonStudentRow => ({
    studentId: id,
    name,
    attendance: 'present',
    homework: 'complete',
    score: '',
    tags: [],
    note: '',
  });

  if (lessonId) {
    const [attRes, scoreRes, logRes, stRes] = await Promise.all([
      supabase.from('attendance_records').select('*').eq('lesson_id', lessonId),
      supabase.from('lesson_scores').select('*').eq('lesson_id', lessonId),
      supabase
        .from('lesson_logs')
        .select('*')
        .eq('class_id', classId)
        .eq('lesson_date', lessonDate)
        .in('student_id', studentIds),
      supabase.from('students').select('id, name').in('id', studentIds),
    ]);

    const names = new Map(
      ((stRes.data ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name])
    );
    const attMap = new Map(
      ((attRes.data ?? []) as { student_id: string; status: AttendanceStatus }[]).map((a) => [
        a.student_id,
        a.status,
      ])
    );
    const scoreMap = new Map(
      ((scoreRes.data ?? []) as { student_id: string; score: number }[]).map((s) => [
        s.student_id,
        s.score,
      ])
    );
    const logMap = new Map(
      ((logRes.data ?? []) as {
        student_id: string;
        homework_status: HomeworkStatus;
        tags: string[];
        memo: string | null;
        attendance_status: AttendanceStatus;
        test_score: number | null;
      }[]).map((l) => [l.student_id, l])
    );

    for (const sid of studentIds) {
      const base = defaults(sid, names.get(sid) ?? '');
      const log = logMap.get(sid);
      rows[sid] = {
        ...base,
        attendance: attMap.get(sid) ?? log?.attendance_status ?? 'present',
        homework: log?.homework_status ?? 'complete',
        score: scoreMap.has(sid)
          ? String(scoreMap.get(sid))
          : log?.test_score != null
            ? String(log.test_score)
            : '',
        tags: log?.tags ?? [],
        note: log?.memo ?? '',
      };
    }
    return rows;
  }

  const { data: logs } = await supabase
    .from('lesson_logs')
    .select('*')
    .eq('class_id', classId)
    .eq('lesson_date', lessonDate)
    .in('student_id', studentIds);

  const { data: sts } = await supabase.from('students').select('id, name').in('id', studentIds);
  const names = new Map(
    ((sts ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name])
  );

  for (const sid of studentIds) {
    const log = ((logs ?? []) as {
      student_id: string;
      attendance_status: AttendanceStatus;
      homework_status: HomeworkStatus;
      test_score: number | null;
      tags: string[];
      memo: string | null;
    }[]).find((l) => l.student_id === sid);
    rows[sid] = {
      ...defaults(sid, names.get(sid) ?? ''),
      attendance: log?.attendance_status ?? 'present',
      homework: log?.homework_status ?? 'complete',
      score: log?.test_score != null ? String(log.test_score) : '',
      tags: log?.tags ?? [],
      note: log?.memo ?? '',
    };
  }
  return rows;
}
