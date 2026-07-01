'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_MATH_UNITS } from '@/lib/curriculumDefaults';
import type { ClassProgress, CurriculumUnit } from '@/types/database';

export function useCurriculum(gradeFilter?: string) {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [progress, setProgress] = useState<ClassProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!profile?.academy_id) {
      setUnits([]);
      setProgress([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let uq = supabase
      .from('curriculum_units')
      .select('*')
      .eq('academy_id', profile.academy_id)
      .order('grade')
      .order('sort_order');
    if (gradeFilter) uq = uq.eq('grade', gradeFilter);

    const [unitsRes, progressRes] = await Promise.all([
      uq,
      supabase
        .from('class_progress')
        .select('*, classes(id, name, grade)')
        .eq('academy_id', profile.academy_id),
    ]);

    if (unitsRes.error) {
      setError('단원 목록을 불러오지 못했습니다.');
    } else {
      setUnits((unitsRes.data ?? []) as CurriculumUnit[]);
    }
    setProgress((progressRes.data ?? []) as ClassProgress[]);
    setLoading(false);
  }, [profile?.academy_id, gradeFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, dataVersion]);

  const importDefaultUnits = async (grade: string, subject = '수학') => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    if (subject !== '수학') {
      return { error: '기본 단원 세트는 수학만 제공됩니다. 직접 단원을 등록해 주세요.' };
    }
    const names = DEFAULT_MATH_UNITS[grade];
    if (!names?.length) return { error: '해당 학년 기본 단원이 없습니다.' };
    const rows = names.map((unit_name, i) => ({
      academy_id: profile.academy_id!,
      subject,
      grade,
      unit_name,
      sort_order: i,
    }));
    const { error: err } = await supabase
      .from('curriculum_units')
      .upsert(rows, { onConflict: 'academy_id,subject,grade,unit_name', ignoreDuplicates: true });
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const addCustomUnit = async (input: { subject: string; grade: string; unit_name: string }) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    const unit_name = input.unit_name.trim();
    if (!unit_name) return { error: '단원명을 입력해 주세요.' };
    const { data: existing } = await supabase
      .from('curriculum_units')
      .select('sort_order')
      .eq('academy_id', profile.academy_id)
      .eq('subject', input.subject)
      .eq('grade', input.grade)
      .order('sort_order', { ascending: false })
      .limit(1);
    const nextOrder = ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1;
    const { error: err } = await supabase.from('curriculum_units').insert({
      academy_id: profile.academy_id,
      subject: input.subject,
      grade: input.grade,
      unit_name,
      sort_order: nextOrder,
    });
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  const setClassProgress = async (input: {
    class_id: string;
    unit_name: string;
    curriculum_unit_id?: string;
    notes?: string;
  }) => {
    if (!profile?.academy_id) return { error: '학원 정보가 없습니다.' };
    const { error: err } = await supabase.from('class_progress').upsert(
      {
        academy_id: profile.academy_id,
        class_id: input.class_id,
        unit_name: input.unit_name,
        curriculum_unit_id: input.curriculum_unit_id ?? null,
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'class_id' }
    );
    if (err) return { error: err.message };
    bumpDataVersion();
    return { error: null };
  };

  return {
    units,
    progress,
    loading,
    error,
    refetch: fetchAll,
    importDefaultUnits,
    addCustomUnit,
    setClassProgress,
  };
}

export function usePortalClassProgress(classId?: string | null) {
  const [row, setRow] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) {
      setRow(null);
      return;
    }
    setLoading(true);
    supabase
      .from('class_progress')
      .select('*')
      .eq('class_id', classId)
      .maybeSingle()
      .then(({ data }) => {
        setRow((data as ClassProgress) ?? null);
        setLoading(false);
      });
  }, [classId]);

  return { progress: row, loading };
}
