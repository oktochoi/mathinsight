import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { sendFcmToTokens } from '@/lib/push/fcm';
import { parentUserIdsForStudent, pushTokensForUsers } from '@/lib/push/resolveRecipients';

type Body = {
  userId?: string;
  studentId?: string;
  title?: string;
  body?: string;
  url?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as Body;
    const title = body.title?.trim();
    const messageBody = body.body?.trim();

    if (!title || !messageBody) {
      return NextResponse.json(
        { ok: false, error: 'title과 body가 필요합니다.' },
        { status: 400 }
      );
    }

    let userIds: string[] = [];
    if (body.userId?.trim()) {
      userIds = [body.userId.trim()];
    } else if (body.studentId?.trim()) {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', body.studentId.trim())
        .eq('academy_id', auth.academyId)
        .maybeSingle();

      if (!student) {
        return NextResponse.json({ ok: false, error: '학생을 찾을 수 없습니다.' }, { status: 404 });
      }

      userIds = await parentUserIdsForStudent(supabase, body.studentId.trim());
    } else {
      return NextResponse.json(
        { ok: false, error: 'userId 또는 studentId가 필요합니다.' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        ok: true,
        pushed: 0,
        skipped: true,
        message: '연결된 수신자가 없어 푸시를 건너뛰었습니다.',
      });
    }

    const tokens = await pushTokensForUsers(userIds);
    const result = await sendFcmToTokens(tokens, {
      title,
      body: messageBody,
      url: body.url?.trim() || '/parent',
    });

    return NextResponse.json({
      ok: true,
      pushed: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      reason: result.reason,
      message: result.skipped
        ? result.reason === 'fcm_not_configured'
          ? 'FIREBASE_SERVICE_ACCOUNT_JSON 또는 FCM_SERVER_KEY 미설정 — 푸시를 건너뛰었습니다.'
          : '등록된 푸시 토큰이 없습니다.'
        : `푸시 ${result.sent}건 발송${result.failed > 0 ? `, 실패 ${result.failed}건` : ''}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
