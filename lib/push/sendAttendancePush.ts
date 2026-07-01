import type { SupabaseClient } from '@supabase/supabase-js';
import type { AttendanceStatus } from '@/types/database';
import { buildAttendancePushMessage } from '@/lib/push/attendanceMessages';
import { sendPushToStudentParents } from '@/lib/push/parentPush';

export type AttendancePushItem = {
  studentId: string;
  attendanceStatus: AttendanceStatus;
};

export async function sendAttendancePushBatch(
  supabase: SupabaseClient,
  academyId: string,
  params: {
    lessonDate: string;
    classId: string;
    className?: string;
    academyName?: string;
    items: AttendancePushItem[];
  }
): Promise<{ sent: number; failed: number; skipped: number; notified: number }> {
  const { lessonDate, classId, items } = params;
  if (items.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, notified: 0 };
  }

  let className = params.className?.trim();
  if (!className) {
    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .eq('academy_id', academyId)
      .maybeSingle();
    className = (cls?.name as string | undefined) ?? '수업';
  }

  let academyName = params.academyName?.trim();
  if (!academyName) {
    const { data: academy } = await supabase
      .from('academies')
      .select('name')
      .eq('id', academyId)
      .maybeSingle();
    academyName = (academy?.name as string | undefined) ?? undefined;
  }

  const studentIds = [...new Set(items.map((i) => i.studentId))];
  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('academy_id', academyId)
    .in('id', studentIds);

  const nameById = new Map((students ?? []).map((s) => [s.id as string, s.name as string]));

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let notified = 0;

  for (const item of items) {
    const studentName = nameById.get(item.studentId);
    if (!studentName) {
      skipped += 1;
      continue;
    }

    const { title, body } = buildAttendancePushMessage({
      studentName,
      className,
      lessonDate,
      attendanceStatus: item.attendanceStatus,
      academyName,
    });

    const result = await sendPushToStudentParents(supabase, {
      studentId: item.studentId,
      title,
      body,
      url: '/parent#overview',
      category: 'attendance',
    });

    if (result.skipped) {
      skipped += 1;
    } else {
      notified += 1;
      sent += result.sent;
      failed += result.failed;
    }
  }

  return { sent, failed, skipped, notified };
}
