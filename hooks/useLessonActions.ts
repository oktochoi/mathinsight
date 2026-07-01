'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifyHomeworkAssigned } from '@/lib/push/notifyHomeworkClient';
import type { LessonRow } from '@/types/database';

type Profile = { academy_id?: string | null; id?: string | null } | null;

type Params = {
  selectedClassId: string;
  date: string;
  unit: string;
  homeworkNote: string;
  lesson: LessonRow | null;
  profile: Profile;
  startLesson: () => Promise<{ error: string | null }>;
  createAndStartLesson: (input: {
    classId: string;
    lessonDate: string;
    unit: string;
  }) => Promise<{ error: string | null }>;
  refetchLesson: () => Promise<void>;
  closeLesson: () => Promise<{ error: string | null }>;
  reopenLesson: () => Promise<{ error: string | null }>;
  showToast: (msg: string) => void;
  setError: (msg: string) => void;
};

export function useLessonActions({
  selectedClassId,
  date,
  unit,
  homeworkNote,
  lesson,
  profile,
  startLesson,
  createAndStartLesson,
  refetchLesson,
  closeLesson,
  reopenLesson,
  showToast,
  setError,
}: Params) {
  const [starting, setStarting] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerSavedAt, setHeaderSavedAt] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const handleStartLesson = async () => {
    setStarting(true);
    setError('');
    if (!lesson) {
      const result = await createAndStartLesson({
        classId: selectedClassId,
        lessonDate: date,
        unit: unit.trim() || '미입력',
      });
      if (result.error) {
        setError(result.error);
        setStarting(false);
        return;
      }
    } else {
      const result = await startLesson();
      if (result.error) {
        setError(result.error);
        setStarting(false);
        return;
      }
    }
    setStarting(false);
    await refetchLesson();
    showToast('수업을 시작했습니다.');
  };

  const handleSaveHeader = async (opts?: { silent?: boolean }) => {
    if (!selectedClassId || !profile?.academy_id || !profile.id) return;
    setSavingHeader(true);
    setError('');
    if (lesson?.id) {
      await supabase.from('lessons').update({ unit: unit.trim() || '미입력' }).eq('id', lesson.id);
    }
    if (homeworkNote.trim() && profile.academy_id) {
      const { data: existing } = await supabase
        .from('homework_assignments')
        .select('id')
        .eq('class_id', selectedClassId)
        .eq('lesson_date', date)
        .maybeSingle();
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 7);
      if ((existing as { id?: string } | null)?.id) {
        await supabase
          .from('homework_assignments')
          .update({ title: homeworkNote.trim(), unit: unit || null })
          .eq('id', (existing as { id: string }).id);
      } else {
        const { data: created } = await supabase
          .from('homework_assignments')
          .insert({
            academy_id: profile.academy_id,
            class_id: selectedClassId,
            title: homeworkNote.trim(),
            due_date: dueDate.toISOString().slice(0, 10),
            lesson_date: date,
            unit: unit || null,
            created_by: profile.id,
          })
          .select('id')
          .single();

        if (created?.id) {
          const { data: classStudents } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', selectedClassId)
            .eq('enrollment_status', 'active');
          notifyHomeworkAssigned(
            created.id as string,
            (classStudents ?? []).map((s) => s.id as string)
          );
        }
      }
    }
    setSavingHeader(false);
    setHeaderSavedAt(Date.now());
    if (!opts?.silent) showToast('저장되었습니다.');
  };

  const handleCloseLesson = async () => {
    setClosing(true);
    setError('');
    const result = await closeLesson();
    setClosing(false);
    if (result.error) setError(result.error);
    else showToast('수업이 마감되었습니다.');
  };

  const handleReopenLesson = async () => {
    setReopening(true);
    setError('');
    const result = await reopenLesson();
    setReopening(false);
    if (result.error) setError(result.error);
    else showToast('수업이 다시 열렸습니다.');
  };

  return {
    handleStartLesson,
    handleSaveHeader,
    handleCloseLesson,
    handleReopenLesson,
    starting,
    savingHeader,
    headerSavedAt,
    closing,
    reopening,
  };
}
