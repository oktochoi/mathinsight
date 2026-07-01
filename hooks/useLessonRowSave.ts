'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { triggerStudentRagReindex } from '@/lib/ragReindex';
import { notifyAttendancePushBatch } from '@/lib/push/notifyAttendanceClient';
import { notifyLessonScore } from '@/lib/push/notifyGradesClient';
import type { LessonFormRow } from '@/lib/lessonLogRowDefaults';
import type { AttendanceStatus } from '@/types/database';

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
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});

  const saveRow = useCallback(
    (studentId: string, row: LessonFormRow) => {
      if (!lessonId || !profile?.academy_id || !profile.id) return;

      clearTimeout(timers.current[studentId]);
      timers.current[studentId] = setTimeout(async () => {
        setSaving((prev) => ({ ...prev, [studentId]: true }));

        const { data: existing } = await supabase
          .from('lesson_logs')
          .select('attendance_status, test_score')
          .eq('academy_id', profile.academy_id!)
          .eq('class_id', classId)
          .eq('student_id', studentId)
          .eq('lesson_date', lessonDate)
          .maybeSingle();

        const prevAttendance = existing?.attendance_status as AttendanceStatus | undefined;
        const prevScore = existing?.test_score as number | null | undefined;
        const score = row.score.trim() ? parseInt(row.score, 10) : null;
        const nextScore = Number.isNaN(score as number) ? null : score;
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
            test_score: nextScore,
            tags: row.tags,
            memo: row.note.trim() || null,
          },
          { onConflict: 'academy_id,class_id,student_id,lesson_date' }
        );

        if (
          prevAttendance != null
            ? prevAttendance !== row.attendance
            : row.attendance !== 'present'
        ) {
          notifyAttendancePushBatch({
            lessonDate,
            classId,
            items: [{ studentId, attendanceStatus: row.attendance }],
          });
        }

        if (nextScore != null && prevScore !== nextScore) {
          notifyLessonScore({
            studentId,
            score: nextScore,
            lessonDate,
            unit: unit.trim() || '미입력',
          });
        }

        triggerStudentRagReindex(studentId);
        setSaving((prev) => ({ ...prev, [studentId]: false }));
        setSavedAt((prev) => ({ ...prev, [studentId]: Date.now() }));
      }, DEBOUNCE_MS);
    },
    [lessonId, classId, lessonDate, unit, profile]
  );

  const flushRow = useCallback(
    async (studentId: string, row: LessonFormRow) => {
      clearTimeout(timers.current[studentId]);
      if (!lessonId || !profile?.academy_id || !profile.id) return;
      setSaving((prev) => ({ ...prev, [studentId]: true }));

      const { data: existing } = await supabase
        .from('lesson_logs')
        .select('attendance_status, test_score')
        .eq('academy_id', profile.academy_id!)
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .eq('lesson_date', lessonDate)
        .maybeSingle();

      const prevAttendance = existing?.attendance_status as AttendanceStatus | undefined;
      const prevScore = existing?.test_score as number | null | undefined;
      const score = row.score.trim() ? parseInt(row.score, 10) : null;
      const nextScore = Number.isNaN(score as number) ? null : score;
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
          test_score: nextScore,
          tags: row.tags,
          memo: row.note.trim() || null,
        },
        { onConflict: 'academy_id,class_id,student_id,lesson_date' }
      );

      if (
        prevAttendance != null
          ? prevAttendance !== row.attendance
          : row.attendance !== 'present'
      ) {
        notifyAttendancePushBatch({
          lessonDate,
          classId,
          items: [{ studentId, attendanceStatus: row.attendance }],
        });
      }

      if (nextScore != null && prevScore !== nextScore) {
        notifyLessonScore({
          studentId,
          score: nextScore,
          lessonDate,
          unit: unit.trim() || '미입력',
        });
      }

      triggerStudentRagReindex(studentId);
      setSaving((prev) => ({ ...prev, [studentId]: false }));
      setSavedAt((prev) => ({ ...prev, [studentId]: Date.now() }));
    },
    [lessonId, classId, lessonDate, unit, profile]
  );

  return { saveRow, flushRow, saving, savedAt };
}
