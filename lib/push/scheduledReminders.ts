import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildPaymentDueSoonMessage,
  buildPaymentOverdueMessage,
} from '@/lib/push/paymentMessages';
import { buildReregistrationReminderMessage } from '@/lib/push/reregistrationMessages';
import { buildHomeworkDueTomorrowMessage } from '@/lib/push/homeworkMessages';
import {
  recordPushReminder,
  sendPushToStudentParents,
  wasPushReminderSent,
} from '@/lib/push/parentPush';
import { sendPushToStudent } from '@/lib/push/studentPush';
import { addDaysIso, daysUntilIso, kstTodayIso } from '@/lib/push/pushDates';
import type { StudentPayment } from '@/types/database';

const REREG_REMINDER_DAYS = [14, 7, 1] as const;
const PAYMENT_DUE_SOON_DAYS = 3;

type PaymentRow = StudentPayment & {
  students?: { name: string } | null;
};

export async function runScheduledPushReminders(admin: SupabaseClient): Promise<{
  paymentDueSoon: number;
  paymentOverdue: number;
  reregistration: number;
  homeworkDueTomorrow: number;
  skipped: number;
}> {
  const today = kstTodayIso();
  const dueSoonDate = addDaysIso(today, PAYMENT_DUE_SOON_DAYS);
  const homeworkDueDate = addDaysIso(today, 1);

  let paymentDueSoon = 0;
  let paymentOverdue = 0;
  let reregistration = 0;
  let homeworkDueTomorrow = 0;
  let skipped = 0;

  const { data: academies } = await admin.from('academies').select('id, name');
  const academyNameById = new Map(
    (academies ?? []).map((a) => [a.id as string, a.name as string])
  );

  for (const academy of academies ?? []) {
    const academyId = academy.id as string;
    const academyName = academyNameById.get(academyId);

    const { data: dueSoonPayments } = await admin
      .from('student_payments')
      .select('*, students(name)')
      .eq('academy_id', academyId)
      .eq('status', 'pending')
      .eq('due_date', dueSoonDate);

    for (const row of (dueSoonPayments ?? []) as PaymentRow[]) {
      const key = `push:payment_d3:${row.id}`;
      if (await wasPushReminderSent(admin, key)) {
        skipped += 1;
        continue;
      }

      const studentName = row.students?.name ?? '학생';
      const { title, body } = buildPaymentDueSoonMessage(
        row,
        studentName,
        PAYMENT_DUE_SOON_DAYS,
        academyName
      );
      const result = await sendPushToStudentParents(admin, {
        studentId: row.student_id,
        title,
        body,
        url: '/parent',
        category: 'payment',
      });

      await recordPushReminder(admin, {
        academyId,
        studentId: row.student_id,
        templateKey: key,
        message: body,
        fcmResult: result,
      });

      if (!result.skipped || result.hadParents) paymentDueSoon += 1;
      else skipped += 1;
    }

    const { data: overduePayments } = await admin
      .from('student_payments')
      .select('*, students(name)')
      .eq('academy_id', academyId)
      .eq('status', 'pending')
      .lt('due_date', today);

    for (const row of (overduePayments ?? []) as PaymentRow[]) {
      const key = `push:payment_overdue:${row.id}:${today}`;
      if (await wasPushReminderSent(admin, key)) {
        skipped += 1;
        continue;
      }

      const studentName = row.students?.name ?? '학생';
      const { title, body } = buildPaymentOverdueMessage(row, studentName, academyName);
      const result = await sendPushToStudentParents(admin, {
        studentId: row.student_id,
        title,
        body,
        url: '/parent',
        category: 'payment',
      });

      await recordPushReminder(admin, {
        academyId,
        studentId: row.student_id,
        templateKey: key,
        message: body,
        fcmResult: result,
      });

      if (!result.skipped || result.hadParents) paymentOverdue += 1;
      else skipped += 1;
    }

    const { data: currentTerms } = await admin
      .from('academic_terms')
      .select('id, name, end_date')
      .eq('academy_id', academyId)
      .eq('is_current', true);

    for (const term of currentTerms ?? []) {
      const termId = term.id as string;
      const endDate = term.end_date as string;
      const daysLeft = daysUntilIso(today, endDate);
      if (!REREG_REMINDER_DAYS.includes(daysLeft as (typeof REREG_REMINDER_DAYS)[number])) {
        continue;
      }

      const { data: activeStudents } = await admin
        .from('students')
        .select('id, name')
        .eq('academy_id', academyId)
        .eq('enrollment_status', 'active');

      for (const student of activeStudents ?? []) {
        const studentId = student.id as string;
        const studentName = student.name as string;

        const { data: rereg } = await admin
          .from('reregistration_records')
          .select('status')
          .eq('student_id', studentId)
          .eq('term_id', termId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (rereg?.status === 'confirmed' || rereg?.status === 'declined') {
          skipped += 1;
          continue;
        }

        const key = `push:rereg_d${daysLeft}:${termId}:${studentId}`;
        if (await wasPushReminderSent(admin, key)) {
          skipped += 1;
          continue;
        }

        const { title, body } = buildReregistrationReminderMessage({
          studentName,
          termName: term.name as string,
          termEndDate: endDate,
          daysLeft,
          academyName,
        });

        const result = await sendPushToStudentParents(admin, {
          studentId,
          title,
          body,
          url: '/parent',
          category: 'reregistration',
        });

        await recordPushReminder(admin, {
          academyId,
          studentId,
          templateKey: key,
          message: body,
          fcmResult: result,
        });

        if (!result.skipped || result.hadParents) reregistration += 1;
        else skipped += 1;
      }
    }

    const { data: dueTomorrowHw } = await admin
      .from('homework_assignments')
      .select('id, title, due_date, class_id')
      .eq('academy_id', academyId)
      .eq('due_date', homeworkDueDate);

    for (const hw of dueTomorrowHw ?? []) {
      const assignmentId = hw.id as string;
      const classId = hw.class_id as string;

      const { data: pendingSubs } = await admin
        .from('homework_submissions')
        .select('student_id')
        .eq('assignment_id', assignmentId)
        .neq('status', 'complete');

      let targetStudentIds = (pendingSubs ?? []).map((s) => s.student_id as string);

      if (targetStudentIds.length === 0) {
        const { data: classStudents } = await admin
          .from('students')
          .select('id')
          .eq('class_id', classId)
          .eq('enrollment_status', 'active');
        targetStudentIds = (classStudents ?? []).map((s) => s.id as string);
      }

      for (const studentId of targetStudentIds) {
        const key = `push:homework_d1:${assignmentId}:${studentId}`;
        if (await wasPushReminderSent(admin, key)) {
          skipped += 1;
          continue;
        }

        const { title, body } = buildHomeworkDueTomorrowMessage({
          title: hw.title as string,
          dueDate: hw.due_date as string,
          academyName,
        });

        const result = await sendPushToStudent(admin, studentId, {
          title,
          body,
          url: '/student#homework',
          category: 'homework',
        });

        await recordPushReminder(admin, {
          academyId,
          studentId,
          templateKey: key,
          message: body,
          fcmResult: result,
        });

        if (!result.skipped || result.hadStudent) homeworkDueTomorrow += 1;
        else skipped += 1;
      }
    }
  }

  return { paymentDueSoon, paymentOverdue, reregistration, homeworkDueTomorrow, skipped };
}
