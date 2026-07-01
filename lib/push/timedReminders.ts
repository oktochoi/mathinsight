import type { SupabaseClient } from '@supabase/supabase-js';
import { recordPushReminder, sendPushToStudentParents, wasPushReminderSent } from '@/lib/push/parentPush';
import { sendPushToStudent } from '@/lib/push/studentPush';
import { ownerDeskUserIds } from '@/lib/push/resolveRecipients';
import { pushTokensForUsers } from '@/lib/push/resolveRecipients';
import { sendFcmToTokens } from '@/lib/push/fcm';
import { kstTodayIso, addDaysIso } from '@/lib/push/pushDates';

function kstDateParts(): { date: string; dayOfWeek: number; minutes: number } {
  const now = new Date();
  const date = kstTodayIso();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { date, dayOfWeek: map[weekday] ?? 0, minutes: hour * 60 + minute };
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/** 수업 30분 전 · 상담 1시간 전 · 상담 전날 */
export async function runTimedPushReminders(admin: SupabaseClient): Promise<{
  lessonSoon: number;
  counselingSoon: number;
  counselingDayBefore: number;
  skipped: number;
}> {
  const { date, dayOfWeek, minutes: nowMin } = kstDateParts();
  const tomorrow = addDaysIso(date, 1);
  let lessonSoon = 0;
  let counselingSoon = 0;
  let counselingDayBefore = 0;
  let skipped = 0;

  const { data: academies } = await admin.from('academies').select('id, name');

  for (const academy of academies ?? []) {
    const academyId = academy.id as string;
    const academyName = academy.name as string;

    const { data: schedules } = await admin
      .from('class_schedules')
      .select('id, class_id, title, start_time, classes(name)')
      .eq('academy_id', academyId)
      .eq('day_of_week', dayOfWeek)
      .neq('schedule_type', 'canceled');

    for (const sch of schedules ?? []) {
      const startMin = parseTimeToMinutes((sch.start_time as string).slice(0, 5));
      const diff = startMin - nowMin;
      if (diff < 25 || diff > 35) continue;

      const classId = sch.class_id as string;
      const className =
        (sch.classes as { name?: string } | null)?.name ?? (sch.title as string) ?? '수업';

      const { data: students } = await admin
        .from('students')
        .select('id')
        .eq('class_id', classId)
        .eq('enrollment_status', 'active');

      for (const st of students ?? []) {
        const studentId = st.id as string;
        const key = `push:lesson_soon:${sch.id}:${date}`;
        if (await wasPushReminderSent(admin, key)) {
          skipped += 1;
          continue;
        }

        const startLabel = (sch.start_time as string).slice(0, 5);
        const body = `오늘 ${startLabel} ${className} 수업이 30분 후에 시작해요. (${academyName})`;
        const result = await sendPushToStudent(admin, studentId, {
          title: '수업 안내',
          body,
          url: '/student#schedule',
        });

        await recordPushReminder(admin, {
          academyId,
          studentId,
          templateKey: key,
          message: body,
          fcmResult: result,
        });

        if (!result.skipped || result.hadStudent) lessonSoon += 1;
        else skipped += 1;
      }
    }

    const { data: sessions } = await admin
      .from('counseling_sessions')
      .select('id, student_id, title, scheduled_at, students(name)')
      .eq('academy_id', academyId)
      .eq('status', 'scheduled')
      .not('scheduled_at', 'is', null);

    for (const session of sessions ?? []) {
      const scheduledAt = session.scheduled_at as string;
      const scheduledDate = scheduledAt.slice(0, 10);
      const studentId = session.student_id as string;
      const studentName = (session.students as { name?: string } | null)?.name ?? '학생';
      const title = (session.title as string) || '상담';

      if (scheduledDate === tomorrow) {
        const key = `push:counsel_d1:${session.id}`;
        if (await wasPushReminderSent(admin, key)) {
          skipped += 1;
          continue;
        }
        const body = `${studentName} 학생 ${title} 상담이 내일 예정되어 있습니다. (${academyName})`;
        const result = await sendPushToStudentParents(admin, {
          studentId,
          title: '상담 일정 안내',
          body,
          url: '/parent',
        });
        await recordPushReminder(admin, {
          academyId,
          studentId,
          templateKey: key,
          message: body,
          fcmResult: result,
        });
        if (!result.skipped || result.hadParents) counselingDayBefore += 1;
        else skipped += 1;
      }

      const schedMs = new Date(scheduledAt).getTime();
      const diffMin = (schedMs - Date.now()) / 60_000;
      if (diffMin >= 55 && diffMin <= 65) {
        const key = `push:counsel_1h:${session.id}`;
        if (await wasPushReminderSent(admin, key)) {
          skipped += 1;
          continue;
        }
        const body = `${studentName} 학생 ${title} 상담이 1시간 후에 시작합니다. (${academyName})`;
        const result = await sendPushToStudentParents(admin, {
          studentId,
          title: '상담 시작 안내',
          body,
          url: '/parent',
        });
        await recordPushReminder(admin, {
          academyId,
          studentId,
          templateKey: key,
          message: body,
          fcmResult: result,
        });
        if (!result.skipped || result.hadParents) counselingSoon += 1;
        else skipped += 1;
      }
    }
  }

  return { lessonSoon, counselingSoon, counselingDayBefore, skipped };
}

/** 이탈 위험 학생 → 원장·원무 푸시 (주 1회) */
export async function runOwnerChurnAlerts(admin: SupabaseClient): Promise<{
  alerts: number;
  skipped: number;
}> {
  const today = kstTodayIso();
  let alerts = 0;
  let skipped = 0;

  const weekAgo = addDaysIso(today, -7);

  const { data: academies } = await admin.from('academies').select('id, name');

  for (const academy of academies ?? []) {
    const academyId = academy.id as string;
    const academyName = academy.name as string;

    const { data: risks } = await admin
      .from('student_risk_snapshots')
      .select('student_id, reason, students(name)')
      .eq('academy_id', academyId)
      .eq('snapshot_type', 'retention')
      .eq('risk_level', 'high')
      .gte('created_at', `${weekAgo}T00:00:00+09:00`);

    if (!risks?.length) continue;

    const ownerIds = await ownerDeskUserIds(admin, academyId);
    const tokens = await pushTokensForUsers(ownerIds);
    if (tokens.length === 0) {
      skipped += risks.length;
      continue;
    }

    for (const risk of risks) {
      const studentId = risk.student_id as string;
      const name = (risk.students as { name?: string } | null)?.name ?? '학생';
      const key = `push:owner_churn:${studentId}:${today.slice(0, 7)}`;
      if (await wasPushReminderSent(admin, key)) {
        skipped += 1;
        continue;
      }

      const body = `${name} 학생 이탈 위험 — ${(risk.reason as string).slice(0, 80)} (${academyName})`;
      const result = await sendFcmToTokens(tokens, {
        title: '재등록·이탈 주의',
        body,
        url: `/students/${studentId}`,
      });

      await recordPushReminder(admin, {
        academyId,
        studentId,
        templateKey: key,
        message: body,
        fcmResult: result,
      });

      if (!result.skipped) alerts += 1;
      else skipped += 1;
    }
  }

  return { alerts, skipped };
}
