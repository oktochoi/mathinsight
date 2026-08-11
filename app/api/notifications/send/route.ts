import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requirePermission } from '@/lib/serverAuth';
import { resolveNotificationPhone } from '@/lib/notifications/resolveRecipientPhone';
import { sendSolapiSms, solapiConfigured } from '@/lib/sms/solapiApi';
import type { NotificationChannel } from '@/types/database';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requirePermission(supabase, 'parent_comms.send');
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      channel?: NotificationChannel;
      recipient_label?: string;
      message?: string;
      student_id?: string;
      template_key?: string;
    };

    if (!body.recipient_label?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { ok: false, error: '수신자와 메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const channel = body.channel ?? 'sms';
    if (!['sms', 'kakao', 'in_app'].includes(channel)) {
      return NextResponse.json({ ok: false, error: '잘못된 채널입니다.' }, { status: 400 });
    }

    const { data: settings } = await supabase
      .from('academy_integrations')
      .select('sms_enabled, kakao_enabled')
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    const integrationOff =
      (channel === 'sms' && !settings?.sms_enabled) ||
      (channel === 'kakao' && !settings?.kakao_enabled);

    let status: 'demo' | 'sent' | 'failed' = 'demo';
    let errorMessage: string | null = null;

    if (channel === 'in_app' || integrationOff) {
      status = 'demo';
      errorMessage = integrationOff
        ? '연동 설정에서 채널이 비활성화되어 데모로 기록됩니다.'
        : '앱 내 알림은 푸시 연동 전까지 데모로 기록됩니다.';
    } else if (channel === 'kakao') {
      status = 'demo';
      errorMessage = '카카오 알림톡은 준비 중입니다. SMS를 이용해 주세요.';
    } else if (!solapiConfigured()) {
      status = 'demo';
      errorMessage = 'Solapi 키가 없어 데모로 기록됩니다. SMS_PROVIDER=solapi를 설정하세요.';
    } else {
      const phone = await resolveNotificationPhone({
        recipientLabel: body.recipient_label.trim(),
        studentId: body.student_id ?? null,
      });
      if (!phone) {
        status = 'failed';
        errorMessage = '수신 번호를 찾을 수 없습니다. 번호를 직접 입력하거나 학생 학부모 연락처를 등록하세요.';
      } else {
        const sent = await sendSolapiSms(phone, body.message.trim());
        if (sent.ok) {
          status = 'sent';
        } else {
          status = 'failed';
          errorMessage = sent.error;
        }
      }
    }

    const sentAt = new Date().toISOString();

    const { error } = await supabase.from('notification_logs').insert({
      academy_id: auth.academyId,
      channel,
      recipient_label: body.recipient_label.trim(),
      student_id: body.student_id ?? null,
      message: body.message.trim(),
      template_key: body.template_key ?? null,
      status,
      sent_at: sentAt,
      created_by: auth.userId,
      error_message: errorMessage,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (status === 'failed') {
      return NextResponse.json({ ok: false, error: errorMessage ?? '발송에 실패했습니다.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      demo: status === 'demo',
      message:
        status === 'demo'
          ? errorMessage ?? '데모로 기록되었습니다.'
          : '문자가 발송되었습니다.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
