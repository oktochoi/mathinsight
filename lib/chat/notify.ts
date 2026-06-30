import type { SupabaseClient } from '@supabase/supabase-js';
import { sendFcmToTokens } from '@/lib/push/fcm';
import {
  ownerDeskUserIds,
  parentUserIdsForStudent,
  pushTokensForUsers,
  studentUserIdsForStudent,
  teacherUserIdsForClass,
  teacherUserIdsForStudent,
} from '@/lib/push/resolveRecipients';

export type ChatSenderRole = 'owner' | 'admin' | 'teacher' | 'desk' | 'parent' | 'student';

export function normalizeSenderRole(role: string): ChatSenderRole {
  if (role === 'owner') return 'admin';
  if (
    role === 'admin' ||
    role === 'teacher' ||
    role === 'desk' ||
    role === 'parent' ||
    role === 'student'
  ) {
    return role;
  }
  return 'parent';
}

export async function notifyChatRecipients(
  supabase: SupabaseClient,
  channel: {
    type: string;
    student_id: string | null;
    class_id: string | null;
    academy_id: string;
    direct_audience?: string | null;
  },
  senderId: string,
  senderName: string,
  body: string,
  url: string
) {
  const recipientIds: string[] = [];
  const owners = await ownerDeskUserIds(supabase, channel.academy_id);

  if (channel.type === 'direct' && channel.student_id) {
    const teacherIds = await teacherUserIdsForStudent(
      supabase,
      channel.student_id,
      channel.academy_id
    );
    recipientIds.push(...teacherIds, ...owners);

    if (channel.direct_audience === 'parent') {
      const parentIds = await parentUserIdsForStudent(supabase, channel.student_id);
      recipientIds.push(...parentIds);
    } else {
      const studentIds = await studentUserIdsForStudent(supabase, channel.student_id);
      recipientIds.push(...studentIds);
    }
  } else if (channel.type === 'class_group' && channel.class_id) {
    const teacherIds = await teacherUserIdsForClass(
      supabase,
      channel.class_id,
      channel.academy_id
    );
    recipientIds.push(...teacherIds, ...owners);

    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', channel.class_id);

    for (const s of students ?? []) {
      const sids = await studentUserIdsForStudent(supabase, s.id as string);
      recipientIds.push(...sids);
    }
  }

  const unique = [...new Set(recipientIds.filter((id) => id !== senderId))];
  const tokens = await pushTokensForUsers(unique);

  return sendFcmToTokens(tokens, {
    title: senderName,
    body: body.length > 80 ? `${body.slice(0, 77)}…` : body,
    url,
  });
}
