import type { SupabaseClient } from '@supabase/supabase-js';
import { sendFcmToTokens, type FcmSendResult } from '@/lib/push/fcm';
import { pushTokensForUsers, studentUserIdsForStudent } from '@/lib/push/resolveRecipients';

import { filterUsersByPushPref, type PushPrefCategory } from '@/lib/notificationPreferences';

export async function sendPushToStudent(
  supabase: SupabaseClient,
  studentId: string,
  params: {
    title: string;
    body: string;
    url?: string;
    category?: PushPrefCategory;
  }
): Promise<FcmSendResult & { hadStudent: boolean }> {
  const studentUserIds = await studentUserIdsForStudent(supabase, studentId);
  if (studentUserIds.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'no_student_portal', hadStudent: false };
  }

  const eligible =
    params.category != null
      ? await filterUsersByPushPref(supabase, studentUserIds, params.category)
      : studentUserIds;

  if (eligible.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'prefs_off', hadStudent: true };
  }

  const tokens = await pushTokensForUsers(eligible);
  const result = await sendFcmToTokens(tokens, {
    title: params.title,
    body: params.body,
    url: params.url ?? '/student#homework',
  });

  return { ...result, hadStudent: true };
}
