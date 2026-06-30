import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { sendFcmToTokens } from '@/lib/push/fcm';
import { parentUserIdsForStudent, pushTokensForUsers } from '@/lib/push/resolveRecipients';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { reportId?: string; studentId?: string };
    if (!body.reportId?.trim() || !body.studentId?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'reportId와 studentId가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: report } = await supabase
      .from('parent_reports')
      .select('id, period_start, period_end, students(name)')
      .eq('id', body.reportId.trim())
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ ok: false, error: '리포트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userIds = await parentUserIdsForStudent(supabase, body.studentId.trim());
    if (userIds.length === 0) {
      return NextResponse.json({
        ok: true,
        notified: 0,
        pushed: 0,
        demo: true,
        message: '연결된 학부모 계정이 없어 알림을 건너뛰었습니다.',
      });
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .in('id', userIds);

    const studentName = (report.students as { name?: string } | null)?.name ?? '학생';
    const period = `${report.period_start} ~ ${report.period_end}`;
    const message = `${studentName} 학습 리포트(${period})가 도착했습니다. 학부모 포털에서 확인해 주세요.`;

    let notified = 0;
    for (const u of users ?? []) {
      const label = u.email || u.phone || u.name || '학부모';
      const { error } = await supabase.from('notification_logs').insert({
        academy_id: auth.academyId,
        channel: 'in_app',
        recipient_label: label,
        student_id: body.studentId.trim(),
        message,
        template_key: 'parent_report_ready',
        status: 'demo',
        sent_at: new Date().toISOString(),
        created_by: auth.userId,
        error_message: '앱 알림 연동 전 — notification_logs에 기록됨',
      });
      if (!error) notified += 1;
    }

    const pushTitle = '새 학습 리포트가 도착했습니다';
    const pushBody = `${studentName} 학생의 리포트(${period})를 확인해 보세요.`;
    const tokens = await pushTokensForUsers(userIds);
    const pushResult = await sendFcmToTokens(tokens, {
      title: pushTitle,
      body: pushBody,
      url: '/parent#reports',
    });

    return NextResponse.json({
      ok: true,
      notified,
      pushed: pushResult.sent,
      pushSkipped: pushResult.skipped,
      pushReason: pushResult.reason,
      demo: pushResult.skipped,
      message:
        pushResult.sent > 0
          ? `학부모 ${notified}명 기록 · 푸시 ${pushResult.sent}건 발송`
          : notified > 0
            ? pushResult.reason === 'fcm_not_configured'
              ? `학부모 ${notified}명 기록 (FCM 미설정 — 푸시 생략)`
              : `학부모 ${notified}명 기록 (앱 토큰 없음 — 푸시 생략)`
            : '알림 기록에 실패했습니다.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
