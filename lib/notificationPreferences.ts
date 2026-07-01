import type { SupabaseClient } from '@supabase/supabase-js';

export const PUSH_PREF_CATEGORIES = [
  { id: 'attendance', label: '출결', desc: '출석·결석·지각 알림' },
  { id: 'homework', label: '숙제', desc: '숙제 등록·마감 안내' },
  { id: 'grades', label: '성적', desc: '시험 점수 등록 알림' },
  { id: 'announcement', label: '공지', desc: '학원 공지' },
  { id: 'payment', label: '수강료', desc: '청구·납부·미납 안내' },
  { id: 'reregistration', label: '재등록', desc: '재등록 기한 안내' },
] as const;

export type PushPrefCategory = (typeof PUSH_PREF_CATEGORIES)[number]['id'];

export type NotificationPrefs = Partial<Record<PushPrefCategory, boolean>>;

const DEFAULT_PREFS: NotificationPrefs = {
  attendance: true,
  homework: true,
  grades: true,
  announcement: true,
  payment: true,
  reregistration: true,
};

export function mergeNotificationPrefs(raw?: NotificationPrefs | null): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...(raw ?? {}) };
}

export async function fetchNotificationPrefs(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPrefs> {
  const { data } = await supabase
    .from('user_notification_prefs')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle();

  return mergeNotificationPrefs((data?.prefs as NotificationPrefs) ?? null);
}

export async function saveNotificationPrefs(
  supabase: SupabaseClient,
  userId: string,
  prefs: NotificationPrefs
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('user_notification_prefs').upsert(
    {
      user_id: userId,
      prefs: mergeNotificationPrefs(prefs),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  return { error: error?.message ?? null };
}

export async function filterUsersByPushPref(
  supabase: SupabaseClient,
  userIds: string[],
  category: PushPrefCategory
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const { data } = await supabase
    .from('user_notification_prefs')
    .select('user_id, prefs')
    .in('user_id', userIds);

  const prefMap = new Map(
    (data ?? []).map((row) => [row.user_id as string, row.prefs as NotificationPrefs])
  );

  return userIds.filter((uid) => {
    const merged = mergeNotificationPrefs(prefMap.get(uid));
    return merged[category] !== false;
  });
}
