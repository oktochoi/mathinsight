'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useStaffScope } from '@/hooks/useStaffScope';
import type { ClassRow } from '@/types/database';

export function useClasses() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const scope = useStaffScope();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!profile?.academy_id || scope.loading) {
      setClasses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('classes')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .order('grade')
      .order('name');

    if (err) {
      setError('반 목록을 불러오지 못했습니다.');
      setClasses([]);
    } else {
      const all = (data ?? []) as ClassRow[];
      // teacher는 담당 반만 표시
      const filtered =
        scope.isTeacher && scope.classIds.length > 0
          ? all.filter((c) => scope.classIds.includes(c.id))
          : all;
      setClasses(filtered);
    }
    setLoading(false);
  }, [profile?.academy_id, scope.loading, scope.isTeacher, scope.classIds]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses, dataVersion]);

  const addClass = async (name: string, grade: string) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    if (!name.trim()) return { error: '반 이름을 입력해 주세요.' };

    const { error: err } = await supabase.from('classes').insert({
      academy_id: profile.academy_id,
      teacher_id: profile.id,
      name: name.trim(),
      grade: grade.trim() || '미지정',
    });

    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  const updateClass = async (id: string, name: string, grade: string) => {
    const { error: err } = await supabase
      .from('classes')
      .update({ name: name.trim(), grade: grade.trim() })
      .eq('id', id);

    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  const deleteClass = async (id: string) => {
    const [{ count: studentCount }, { count: logCount }] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', id),
      supabase
        .from('lesson_logs')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', id),
    ]);

    if ((studentCount ?? 0) > 0) {
      return {
        error: `이 반에 학생 ${studentCount}명이 있습니다. 학생을 다른 반으로 옮긴 뒤 삭제해 주세요.`,
      };
    }
    if ((logCount ?? 0) > 0) {
      return {
        error: `이 반에 수업 기록 ${logCount}건이 있습니다. 삭제할 수 없습니다.`,
      };
    }

    const { error: err } = await supabase.from('classes').delete().eq('id', id);
    if (!err) bumpDataVersion();
    return { error: err?.message ?? null };
  };

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
    addClass,
    updateClass,
    deleteClass,
  };
}
