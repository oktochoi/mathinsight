'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { triggerStudentRagReindex } from '@/lib/ragReindex';
import type { LessonFormRow } from '@/lib/lessonLogRowDefaults';

const DEBOUNCE_MS = 600;

export function useLessonRowSave(
  lessonId: string | null,
  classId: string,
  lessonDate: string,
  unit: string
) {
  const { profile } = useAuth();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const saveRow = useCallback(
    (studentId: string, row: LessonFormRow) => {
      if (!lessonId || !profile?.academy_id || !profile.id) return;

      clearTimeout(timers.current[studentId]);
      timers.current[studentId] = setTimeout(async () => {
        setSaving((prev) => ({ ...prev, [studentId]: true }));
        const score = row.score.trim() ? parseInt(row.score, 10) : null;
        await supabase.from('lesson_logs').upsert(
          {
            academy_id: profile.academy_id!,
            class_id: classId,
            student_id: studentId,
            teacher_id: profile.id,
            lesson_date: lessonDate,
            lesson_id: lessonId,
            unit: unit.trim() || '미입력',
            attendance_status: row.attendance,
            homework_status: row.homework,
            test_score: Number.isNaN(score as number) ? null : score,
            tags: row.tags,
            memo: row.note.trim() || null,
          },
          { onConflict: 'academy_id,class_id,student_id,lesson_date' }
        );
        triggerStudentRagReindex(studentId);
        setSaving((prev) => ({ ...prev, [studentId]: false }));
      }, DEBOUNCE_MS);
    },
    [lessonId, classId, lessonDate, unit, profile]
  );

  const flushRow = useCallback(
    async (studentId: string, row: LessonFormRow) => {
      clearTimeout(timers.current[studentId]);
      if (!lessonId || !profile?.academy_id || !profile.id) return;
      setSaving((prev) => ({ ...prev, [studentId]: true }));
      const score = row.score.trim() ? parseInt(row.score, 10) : null;
      await supabase.from('lesson_logs').upsert(
        {
          academy_id: profile.academy_id!,
          class_id: classId,
          student_id: studentId,
          teacher_id: profile.id,
          lesson_date: lessonDate,
          lesson_id: lessonId,
          unit: unit.trim() || '미입력',
          attendance_status: row.attendance,
          homework_status: row.homework,
          test_score: Number.isNaN(score as number) ? null : score,
          tags: row.tags,
          memo: row.note.trim() || null,
        },
        { onConflict: 'academy_id,class_id,student_id,lesson_date' }
      );
      triggerStudentRagReindex(studentId);
      setSaving((prev) => ({ ...prev, [studentId]: false }));
    },
    [lessonId, classId, lessonDate, unit, profile]
  );

  return { saveRow, flushRow, saving };
}
