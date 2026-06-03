'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { deriveStudentStatusFromRisk } from '@/lib/studentRisk';
import type { Student, StudentStatus } from '@/types/database';

export function useStudents() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!profile?.academy_id) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('students')
      .select('*, classes(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false });

    if (err) {
      setError('학생 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setStudents([]);
    } else {
      setStudents((data ?? []) as Student[]);
    }
    setLoading(false);
  }, [profile?.academy_id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, dataVersion]);

  const addStudent = async (payload: {
    name: string;
    grade: string;
    class_id: string | null;
    school: string;
    status: StudentStatus;
  }) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    const { data, error: err } = await supabase
      .from('students')
      .insert({
        academy_id: profile.academy_id,
        name: payload.name,
        grade: payload.grade,
        class_id: payload.class_id,
        school: payload.school || null,
        status: payload.status,
      })
      .select('id')
      .single();
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null, id: data?.id as string | undefined };
  };

  const updateStudent = async (
    id: string,
    payload: Partial<Pick<Student, 'name' | 'grade' | 'class_id' | 'school' | 'status'>>
  ) => {
    const { error: err } = await supabase.from('students').update(payload).eq('id', id);
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  const deleteStudent = async (id: string) => {
    const { error: err } = await supabase.from('students').delete().eq('id', id);
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  const syncStudentStatusFromLogs = async (studentId: string) => {
    const { data: logs } = await supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('lesson_date', { ascending: false })
      .limit(12);
    const status = deriveStudentStatusFromRisk((logs ?? []) as import('@/types/database').LessonLog[]);
    await supabase.from('students').update({ status }).eq('id', studentId);
    bumpDataVersion();
  };

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    syncStudentStatusFromLogs,
  };
}

export function useStudent(id: string | undefined) {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('students')
      .select('*, classes(id, name, grade)')
      .eq('id', id)
      .maybeSingle();
    if (err) setError('학생 정보를 불러오지 못했습니다.');
    else setStudent((data as Student) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne, dataVersion]);

  return { student, loading, error, refetch: fetchOne };
}
