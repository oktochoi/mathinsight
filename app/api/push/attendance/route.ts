import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { sendAttendancePushBatch } from '@/lib/push/sendAttendancePush';
import type { AttendanceStatus } from '@/types/database';

type Body = {
  lessonDate?: string;
  classId?: string;
  className?: string;
  academyName?: string;
  items?: Array<{ studentId: string; attendanceStatus: AttendanceStatus }>;
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
    const lessonDate = body.lessonDate?.trim();
    const classId = body.classId?.trim();
    const items = body.items ?? [];

    if (!lessonDate || !classId || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'lessonDate, classId, items가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await sendAttendancePushBatch(supabase, auth.academyId, {
      lessonDate,
      classId,
      className: body.className,
      academyName: body.academyName,
      items,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.notified === 0
          ? '연결된 학부모·푸시 토큰이 없어 알림을 건너뛰었습니다.'
          : `학부모 푸시 ${result.sent}건 발송${result.failed > 0 ? `, 실패 ${result.failed}건` : ''}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
