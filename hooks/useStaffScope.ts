'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import type { StaffScope } from '@/types/database';

const empty: StaffScope = {
  staffProfileId: null,
  classIds: [],
  studentIds: [],
  isTeacher: false,
  isOwner: false,
  loading: true,
};

export function useStaffScope(): StaffScope {
  const { profile } = useAuth();
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [scope, setScope] = useState<StaffScope>(empty);

  const load = useCallback(async () => {
    if (!profile?.academy_id) {
      setScope({ ...empty, loading: false });
      return;
    }

    const isTeacher = profile.role === 'teacher';
    const isOwner = profile.role === 'owner';

    const { data: sp } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .eq('academy_id', profile.academy_id)
      .maybeSingle();

    const staffProfileId = (sp as { id: string } | null)?.id ?? null;

    if (!isTeacher || !staffProfileId) {
      setScope({
        staffProfileId,
        classIds: [],
        studentIds: [],
        isTeacher,
        isOwner,
        loading: false,
      });
      return;
    }

    const { data: classRows } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('staff_id', staffProfileId)
      .is('end_date', null);

    const classIds = [...new Set((classRows ?? []).map((r) => (r as { class_id: string }).class_id))];

    if (classIds.length === 0) {
      const { data: legacy } = await supabase
        .from('classes')
        .select('id')
        .eq('academy_id', profile.academy_id)
        .eq('teacher_id', profile.id);
      classIds.push(...(legacy ?? []).map((r) => (r as { id: string }).id));
    }

    let studentIds: string[] = [];
    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .in('class_id', classIds)
        .eq('status', 'active')
        .is('end_date', null);

      studentIds = [...new Set((enrollments ?? []).map((e) => (e as { student_id: string }).student_id))];

      if (studentIds.length === 0) {
        const { data: sts } = await supabase
          .from('students')
          .select('id')
          .eq('academy_id', profile.academy_id)
          .in('class_id', classIds);
        studentIds = (sts ?? []).map((s) => (s as { id: string }).id);
      }
    }

    setScope({
      staffProfileId,
      classIds,
      studentIds,
      isTeacher,
      isOwner,
      loading: false,
    });
  }, [profile?.academy_id, profile?.id, profile?.role]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  return scope;
}
