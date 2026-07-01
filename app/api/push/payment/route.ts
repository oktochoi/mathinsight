import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import {
  buildPaymentCreatedMessage,
  buildPaymentOverdueMessage,
  buildPaymentPaidMessage,
} from '@/lib/push/paymentMessages';
import { sendPushToStudentParents } from '@/lib/push/parentPush';
import type { StudentPayment } from '@/types/database';

type Body = {
  type?: 'created' | 'paid' | 'overdue';
  paymentId?: string;
  paymentIds?: string[];
};

async function pushForPayment(
  supabase: ReturnType<typeof createClient>,
  academyId: string,
  academyName: string | undefined,
  payment: StudentPayment & { students?: { name: string } | null },
  type: 'created' | 'paid' | 'overdue'
) {
  const studentName = payment.students?.name ?? '학생';
  const message =
    type === 'created'
      ? buildPaymentCreatedMessage(payment, studentName, academyName)
      : type === 'paid'
        ? buildPaymentPaidMessage(payment, studentName, academyName)
        : buildPaymentOverdueMessage(payment, studentName, academyName);

  return sendPushToStudentParents(supabase, {
    studentId: payment.student_id,
    title: message.title,
    body: message.body,
    url: '/parent',
    category: 'payment',
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as Body;
    const type = body.type;

    if (type !== 'created' && type !== 'paid' && type !== 'overdue') {
      return NextResponse.json(
        { ok: false, error: 'type(created|paid|overdue)가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: academy } = await supabase
      .from('academies')
      .select('name')
      .eq('id', auth.academyId)
      .maybeSingle();
    const academyName = academy?.name as string | undefined;

    if (type === 'overdue' && body.paymentIds?.length) {
      const ids = [...new Set(body.paymentIds.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
      if (ids.length === 0) {
        return NextResponse.json({ ok: false, error: 'paymentIds가 필요합니다.' }, { status: 400 });
      }

      const { data: payments } = await supabase
        .from('student_payments')
        .select('*, students(name)')
        .eq('academy_id', auth.academyId)
        .in('id', ids)
        .eq('status', 'pending');

      let pushed = 0;
      let failed = 0;
      let skipped = 0;

      for (const payment of payments ?? []) {
        const row = payment as StudentPayment & { students?: { name: string } | null };
        const result = await pushForPayment(supabase, auth.academyId, academyName, row, 'overdue');
        if (result.skipped) skipped += 1;
        else {
          pushed += result.sent;
          failed += result.failed;
        }
      }

      return NextResponse.json({
        ok: true,
        pushed,
        failed,
        skipped,
        message:
          pushed > 0
            ? `미납 안내 푸시 ${pushed}건 발송`
            : '연결된 학부모·푸시 토큰이 없거나 FCM 미설정입니다.',
      });
    }

    const paymentId = body.paymentId?.trim();
    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: 'paymentId가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: payment } = await supabase
      .from('student_payments')
      .select('*, students(name)')
      .eq('id', paymentId)
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json({ ok: false, error: '청구를 찾을 수 없습니다.' }, { status: 404 });
    }

    const row = payment as StudentPayment & { students?: { name: string } | null };
    const result = await pushForPayment(supabase, auth.academyId, academyName, row, type);

    return NextResponse.json({
      ok: true,
      pushed: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      reason: result.reason,
      message: result.skipped
        ? '연결된 학부모·푸시 토큰이 없거나 FCM 미설정입니다.'
        : `학부모 푸시 ${result.sent}건 발송`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
