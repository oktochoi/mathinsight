'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { useStaffScope } from '@/hooks/useStaffScope';
import type { ClassSchedule, ScheduleType } from '@/types/database';

export type ClassScheduleInsert = {
  class_id: string;
  teacher_id?: string | null;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  schedule_type: ScheduleType;
  location?: string | null;
  memo?: string | null;
  is_recurring?: boolean;
  is_visible_to_parent?: boolean;
};

export function useClassSchedules() {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const scope = useStaffScope();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [exceptions, setExceptions] = useState<
    import('@/types/database').ScheduleException[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.academy_id || scope.loading) {
      setSchedules([]);
      setExceptions([]);
      setLoading(false);
      return;
    }

    if (scope.isTeacher && scope.classIds.length === 0) {
      setSchedules([]);
      setExceptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let schQuery = supabase
      .from('class_schedules')
      .select('*, classes(id, name, grade)')
      .eq('academy_id', profile.academy_id)
      .order('day_of_week')
      .order('start_time');

    let exQuery = supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .order('exception_date', { ascending: false })
      .limit(200);

    if (scope.isTeacher) {
      schQuery = schQuery.in('class_id', scope.classIds);
      exQuery = exQuery.in('class_id', scope.classIds);
    }

    const [schRes, exRes] = await Promise.all([schQuery, exQuery]);

    if (schRes.error || exRes.error) {
      setError('일정을 불러오지 못했습니다.');
    } else {
      setSchedules((schRes.data ?? []) as ClassSchedule[]);
      setExceptions(exRes.data ?? []);
    }
    setLoading(false);
  }, [profile?.academy_id, scope.loading, scope.isTeacher, scope.classIds]);

  useEffect(() => {
    load();
  }, [load, dataVersion]);

  const bump = useAppStore((s) => s.bumpDataVersion);

  const addSchedule = async (row: ClassScheduleInsert) => {
    if (!profile?.academy_id) return { error: '학원 정보 없음' };
    const { error: err } = await supabase.from('class_schedules').insert({
      academy_id: profile.academy_id,
      ...row,
      is_recurring: row.is_recurring ?? true,
      is_visible_to_parent: row.is_visible_to_parent ?? true,
    });
    if (!err) bump();
    return { error: err?.message ?? null };
  };

  const updateSchedule = async (id: string, row: Partial<ClassScheduleInsert>) => {
    const { error: err } = await supabase
      .from('class_schedules')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!err) bump();
    return { error: err?.message ?? null };
  };

  const deleteSchedule = async (id: string) => {
    const { error: err } = await supabase.from('class_schedules').delete().eq('id', id);
    if (!err) bump();
    return { error: err?.message ?? null };
  };

  const addException = async (
    row: Omit<import('@/types/database').ScheduleException, 'id' | 'created_at' | 'academy_id'> & {
      academy_id?: string;
    }
  ) => {
    if (!profile?.academy_id) return { error: '학원 정보 없음' };
    const { error: err } = await supabase.from('schedule_exceptions').insert({
      academy_id: profile.academy_id,
      class_schedule_id: row.class_schedule_id,
      class_id: row.class_id,
      exception_date: row.exception_date,
      exception_type: row.exception_type,
      start_time: row.start_time,
      end_time: row.end_time,
      memo: row.memo,
      is_visible_to_parent: row.is_visible_to_parent ?? true,
    });
    if (!err) bump();
    return { error: err?.message ?? null };
  };

  return {
    schedules,
    exceptions,
    loading,
    error,
    refetch: load,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addException,
  };
}

/** 포털: 연결된 반 일정만 */
export function usePortalSchedules(classIds: string[]) {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [exceptions, setExceptions] = useState<
    import('@/types/database').ScheduleException[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classIds.length === 0) {
      setSchedules([]);
      setExceptions([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [schRes, exRes] = await Promise.all([
        supabase
          .from('class_schedules')
          .select('*, classes(id, name, grade)')
          .in('class_id', classIds)
          .eq('is_visible_to_parent', true),
        supabase
          .from('schedule_exceptions')
          .select('*')
          .in('class_id', classIds)
          .eq('is_visible_to_parent', true)
          .gte('exception_date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
      ]);
      setSchedules((schRes.data ?? []) as ClassSchedule[]);
      setExceptions(exRes.data ?? []);
      setLoading(false);
    })();
  }, [classIds.join(',')]);

  return { schedules, exceptions, loading };
}
