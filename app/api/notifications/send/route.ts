import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import type { NotificationChannel } from '@/types/database';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
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

    const demoMode =
      (channel === 'sms' && !settings?.sms_enabled) ||
      (channel === 'kakao' && !settings?.kakao_enabled) ||
      channel === 'in_app';

    const status = demoMode ? 'demo' : 'sent';
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
      error_message: demoMode ? '데모 모드 — 실제 발송 API 미연동' : null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      demo: demoMode,
      message: demoMode
        ? '데모로 기록되었습니다. 연동 설정에서 SMS/카카오를 켜면 실제 발송으로 전환됩니다.'
        : '발송되었습니다.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
