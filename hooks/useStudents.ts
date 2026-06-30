'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useStaffScope } from '@/hooks/useStaffScope';
import { deriveStudentStatusFromRisk } from '@/lib/studentRisk';
import type { Student, StudentStatus, EnrollmentStatus } from '@/types/database';

export function useStudents() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const scope = useStaffScope();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!profile?.academy_id || scope.loading) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let query = supabase
      .from('students')
      .select('*, classes(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('created_at', { ascending: false });

    // teacher는 담당 반 학생만 조회
    if (scope.isTeacher && scope.classIds.length > 0) {
      query = query.in('class_id', scope.classIds);
    }

    const { data, error: err } = await query;

    if (err) {
      setError('학생 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setStudents([]);
    } else {
      setStudents((data ?? []) as Student[]);
    }
    setLoading(false);
  }, [profile?.academy_id, scope.loading, scope.isTeacher, scope.classIds]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, dataVersion]);

  const addStudent = async (payload: {
    name: string;
    grade: string;
    class_id: string | null;
    school: string;
    status: StudentStatus;
    enrollment_status?: EnrollmentStatus;
    registered_at?: string | null;
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
        enrollment_status: payload.enrollment_status ?? 'active',
        registered_at: payload.registered_at ?? new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null, id: data?.id as string | undefined };
  };

  const bulkAddStudents = async (
    rows: { name: string; grade: string; school: string; class_id?: string | null }[]
  ) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.', added: 0 };
    if (rows.length === 0) return { error: '등록할 학생이 없습니다.', added: 0 };

    const payload = rows.map((row) => ({
      academy_id: profile.academy_id,
      name: row.name,
      grade: row.grade,
      class_id: row.class_id ?? null,
      school: row.school || null,
      status: 'stable' as const,
      enrollment_status: 'active' as const,
      registered_at: new Date().toISOString().slice(0, 10),
    }));

    const { data, error: err } = await supabase.from('students').insert(payload).select('id');
    if (!err) bumpDataVersion();
    return {
      error: err?.message ?? null,
      added: data?.length ?? 0,
    };
  };

  const updateStudent = async (
    id: string,
    payload: Partial<Pick<Student, 'name' | 'grade' | 'class_id' | 'school' | 'phone' | 'status' | 'enrollment_status' | 'registered_at' | 'withdrawal_reason' | 'withdrawn_at'>>
  ) => {
    const { error: err } = await supabase.from('students').update(payload).eq('id', id);
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  const withdrawStudent = async (id: string, reason?: string) => {
    const { error: err } = await supabase.from('students').update({
      enrollment_status: 'withdrawn',
      withdrawn_at: new Date().toISOString().slice(0, 10),
      withdrawal_reason: reason ?? null,
    }).eq('id', id);
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
    bulkAddStudents,
    updateStudent,
    withdrawStudent,
    deleteStudent,
    syncStudentStatusFromLogs,
  };
}

export function useStudent(id: string | undefined, initialStudent?: Student | null) {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [student, setStudent] = useState<Student | null>(initialStudent ?? null);
  const [loading, setLoading] = useState(!initialStudent);
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
