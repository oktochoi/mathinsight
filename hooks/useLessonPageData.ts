'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useLessonPageData(classId: string, date: string) {
  const [homeworkNote, setHomeworkNote] = useState('');
  const [lastHomework, setLastHomework] = useState<{ title: string; date: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId || !date) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const [todayHw, prevHw] = await Promise.all([
        supabase
          .from('homework_assignments')
          .select('title')
          .eq('class_id', classId)
          .eq('lesson_date', date)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('homework_assignments')
          .select('title, lesson_date')
          .eq('class_id', classId)
          .lt('lesson_date', date)
          .order('lesson_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (todayHw.data) setHomeworkNote((todayHw.data as { title: string }).title);
      else setHomeworkNote('');
      if (prevHw.data) {
        const row = prevHw.data as { title: string; lesson_date: string };
        setLastHomework({ title: row.title, date: row.lesson_date });
      } else {
        setLastHomework(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, date]);

  const loadClassProgress = useCallback(async (): Promise<string | null> => {
    if (!classId) return null;
    const { data } = await supabase
      .from('class_progress')
      .select('unit_name')
      .eq('class_id', classId)
      .maybeSingle();
    return (data as { unit_name?: string } | null)?.unit_name ?? null;
  }, [classId]);

  const loadDefaultUnit = useCallback(async (): Promise<string | null> => {
    return loadClassProgress();
  }, [loadClassProgress]);

  const resetForContext = useCallback(() => {
    setHomeworkNote('');
    setLastHomework(null);
  }, []);

  return {
    homeworkNote,
    setHomeworkNote,
    lastHomework,
    loading,
    loadClassProgress,
    loadDefaultUnit,
    resetForContext,
  };
}
