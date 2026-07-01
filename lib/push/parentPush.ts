import type { SupabaseClient } from '@supabase/supabase-js';
import { sendFcmToTokens, type FcmSendResult } from '@/lib/push/fcm';
import { parentUserIdsForStudent, pushTokensForUsers } from '@/lib/push/resolveRecipients';
import { filterUsersByPushPref, type PushPrefCategory } from '@/lib/notificationPreferences';

export async function sendPushToStudentParents(
  supabase: SupabaseClient,
  params: {
    studentId: string;
    title: string;
    body: string;
    url?: string;
    category?: PushPrefCategory;
  }
): Promise<FcmSendResult & { hadParents: boolean }> {
  const parentIds = await parentUserIdsForStudent(supabase, params.studentId);
  if (parentIds.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'no_parents', hadParents: false };
  }

  const eligible =
    params.category != null
      ? await filterUsersByPushPref(supabase, parentIds, params.category)
      : parentIds;

  if (eligible.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'prefs_off', hadParents: true };
  }

  const tokens = await pushTokensForUsers(eligible);
  const result = await sendFcmToTokens(tokens, {
    title: params.title,
    body: params.body,
    url: params.url ?? '/parent',
  });

  return { ...result, hadParents: true };
}

/** cron·자동 알림 중복 방지 (notification_logs.template_key) */
export async function wasPushReminderSent(
  admin: SupabaseClient,
  templateKey: string
): Promise<boolean> {
  const { data } = await admin
    .from('notification_logs')
    .select('id')
    .eq('template_key', templateKey)
    .in('status', ['sent', 'demo'])
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function recordPushReminder(
  admin: SupabaseClient,
  params: {
    academyId: string;
    studentId: string;
    templateKey: string;
    message: string;
    fcmResult: FcmSendResult;
  }
): Promise<void> {
  const status =
    params.fcmResult.skipped && params.fcmResult.reason === 'fcm_not_configured'
      ? 'demo'
      : 'sent';

  await admin.from('notification_logs').insert({
    academy_id: params.academyId,
    channel: 'in_app',
    recipient_label: 'parent_app_push',
    student_id: params.studentId,
    message: params.message,
    template_key: params.templateKey,
    status,
    sent_at: new Date().toISOString(),
    error_message: params.fcmResult.skipped ? params.fcmResult.reason ?? null : null,
  });
}
