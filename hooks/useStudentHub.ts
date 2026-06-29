'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type {
  LessonRow,
  ParentEntity,
  ParentStudentLink,
  ReregistrationRecord,
  StudentEnrollment,
  StudentRiskSnapshot,
} from '@/types/database';

export function useStudentHub(studentId: string) {
  const dataVersion = useAppStore((s) => s.dataVersion);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [homeroomTeacher, setHomeroomTeacher] = useState<string | null>(null);
  const [parentLinks, setParentLinks] = useState<ParentStudentLink[]>([]);
  const [riskSnapshots, setRiskSnapshots] = useState<StudentRiskSnapshot[]>([]);
  const [reregistration, setReregistration] = useState<ReregistrationRecord | null>(null);
  const [recentLessons, setRecentLessons] = useState<LessonRow[]>([]);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);

    const [enrRes, linksRes, snapRes, reregRes] = await Promise.all([
      supabase
        .from('student_enrollments')
        .select('*, classes(id, name, grade)')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .is('end_date', null)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('parent_student_links')
        .select('*, parents(*)')
        .eq('student_id', studentId),
      supabase
        .from('student_risk_snapshots')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('reregistration_records')
        .select('*')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const enr = enrRes.data as StudentEnrollment | null;
    setEnrollment(enr);
    setParentLinks((linksRes.data ?? []) as ParentStudentLink[]);
    setRiskSnapshots((snapRes.data ?? []) as StudentRiskSnapshot[]);
    setReregistration((reregRes.data as ReregistrationRecord | null) ?? null);

    if (enr?.class_id) {
      const { data: cls } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', enr.class_id)
        .maybeSingle();
      const teacherId = (cls as { teacher_id?: string } | null)?.teacher_id;
      if (teacherId) {
        const { data: u } = await supabase.from('users').select('name').eq('id', teacherId).maybeSingle();
        setHomeroomTeacher((u as { name?: string } | null)?.name ?? null);
      } else {
        setHomeroomTeacher(null);
      }

      const { data: recent } = await supabase
        .from('lessons')
        .select('*, classes(id, name, grade)')
        .eq('class_id', enr.class_id)
        .order('lesson_date', { ascending: false })
        .limit(5);
      setRecentLessons((recent ?? []) as LessonRow[]);
    } else {
      setHomeroomTeacher(null);
      setRecentLessons([]);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load, dataVersion]);

  const parents = parentLinks
    .map((l) => l.parents)
    .filter((p): p is ParentEntity => Boolean(p));

  return {
    loading,
    enrollment,
    homeroomTeacher,
    parentLinks,
    parents,
    riskSnapshots,
    reregistration,
    recentLessons,
    refetch: load,
  };
}
