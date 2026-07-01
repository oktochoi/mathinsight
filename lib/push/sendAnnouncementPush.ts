import type { SupabaseClient } from '@supabase/supabase-js';
import { buildAnnouncementPushMessage } from '@/lib/push/announcementMessages';
import { sendPushToStudentParents } from '@/lib/push/parentPush';
import { sendPushToStudent } from '@/lib/push/studentPush';
import { parentUserIdsForStudent, studentUserIdsForStudent } from '@/lib/push/resolveRecipients';
import type { AnnouncementTargetType } from '@/types/database';

async function studentIdsForTarget(
  admin: SupabaseClient,
  academyId: string,
  targetType: AnnouncementTargetType,
  classId?: string | null,
  studentId?: string | null
): Promise<string[]> {
  if (targetType === 'student' && studentId) return [studentId];

  if (targetType === 'class' && classId) {
    const { data } = await admin
      .from('students')
      .select('id')
      .eq('academy_id', academyId)
      .eq('class_id', classId)
      .eq('enrollment_status', 'active');
    return (data ?? []).map((s) => s.id as string);
  }

  const { data } = await admin
    .from('students')
    .select('id')
    .eq('academy_id', academyId)
    .eq('enrollment_status', 'active');
  return (data ?? []).map((s) => s.id as string);
}

export async function sendAnnouncementPush(
  admin: SupabaseClient,
  academyId: string,
  params: {
    announcementId: string;
    title: string;
    targetType: AnnouncementTargetType;
    classId?: string | null;
    studentId?: string | null;
    academyName?: string;
  }
): Promise<{ parents: number; students: number; skipped: number }> {
  const message = buildAnnouncementPushMessage({
    title: params.title,
    academyName: params.academyName,
  });

  const studentIds = await studentIdsForTarget(
    admin,
    academyId,
    params.targetType,
    params.classId,
    params.studentId
  );

  let parents = 0;
  let students = 0;
  let skipped = 0;
  const seenParents = new Set<string>();

  for (const sid of studentIds) {
    const parentIds = await parentUserIdsForStudent(admin, sid);
    const hasNewParent = parentIds.some((pid) => !seenParents.has(pid));
    if (hasNewParent) {
      parentIds.forEach((pid) => seenParents.add(pid));
      const result = await sendPushToStudentParents(admin, {
        studentId: sid,
        title: message.title,
        body: message.body,
        url: '/parent#notices',
        category: 'announcement',
      });
      if (result.skipped) skipped += 1;
      else parents += result.sent;
    }

    const studentUsers = await studentUserIdsForStudent(admin, sid);
    if (studentUsers.length > 0) {
      const result = await sendPushToStudent(admin, sid, {
        title: message.title,
        body: message.body,
        url: '/student#notices',
        category: 'announcement',
      });
      if (result.skipped) skipped += 1;
      else students += result.sent;
    }
  }

  return { parents, students, skipped };
}
