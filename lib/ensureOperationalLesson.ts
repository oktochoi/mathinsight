import type { SupabaseClient } from '@supabase/supabase-js';

export type OperationalLessonDay = {
  academy_id: string;
  class_id: string;
  lesson_date: string;
  teacher_id: string;
  unit?: string;
};

/** lesson_logs 트리거가 lessons에 insert하기 전에 유효한 scheduled 수업 row 선생성 (028 미적용 DB 대응) */
export async function ensureOperationalLesson(
  supabase: SupabaseClient,
  day: OperationalLessonDay
): Promise<{ error: string | null }> {
  const { data: existing, error: readErr } = await supabase
    .from('lessons')
    .select('id')
    .eq('class_id', day.class_id)
    .eq('lesson_date', day.lesson_date)
    .maybeSingle();

  if (readErr) {
    if (readErr.message.includes('does not exist') || readErr.code === '42P01') {
      return { error: null };
    }
    return { error: readErr.message };
  }

  if (existing?.id) return { error: null };

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('user_id', day.teacher_id)
    .eq('academy_id', day.academy_id)
    .maybeSingle();

  const { error: upsertErr } = await supabase.from('lessons').upsert(
    {
      academy_id: day.academy_id,
      class_id: day.class_id,
      lesson_date: day.lesson_date,
      teacher_id: day.teacher_id,
      staff_id: staff?.id ?? null,
      unit: day.unit?.trim() || '',
      status: 'scheduled',
    },
    { onConflict: 'class_id,lesson_date' }
  );

  if (upsertErr) {
    if (upsertErr.code === '23505') return { error: null };
    return { error: upsertErr.message };
  }

  return { error: null };
}

export async function ensureOperationalLessonsForRows(
  supabase: SupabaseClient,
  rows: OperationalLessonDay[]
): Promise<{ error: string | null }> {
  const seen = new Set<string>();
  const days: OperationalLessonDay[] = [];

  for (const row of rows) {
    const key = `${row.class_id}:${row.lesson_date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    days.push(row);
  }

  for (const day of days) {
    const result = await ensureOperationalLesson(supabase, day);
    if (result.error) return result;
  }

  return { error: null };
}
