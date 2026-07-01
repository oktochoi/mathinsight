import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { sendAnnouncementPush } from '@/lib/push/sendAnnouncementPush';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { announcementId?: string };
    const announcementId = body.announcementId?.trim();
    if (!announcementId) {
      return NextResponse.json({ ok: false, error: 'announcementId가 필요합니다.' }, { status: 400 });
    }

    const { data: row } = await supabase
      .from('announcements')
      .select('id, title, target_type, class_id, student_id, status')
      .eq('id', announcementId)
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    if (!row || row.status !== 'published') {
      return NextResponse.json({ ok: false, error: '발행된 공지를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: academy } = await supabase
      .from('academies')
      .select('name')
      .eq('id', auth.academyId)
      .maybeSingle();

    const result = await sendAnnouncementPush(supabase, auth.academyId, {
      announcementId,
      title: row.title as string,
      targetType: row.target_type as 'all' | 'class' | 'student',
      classId: row.class_id as string | null,
      studentId: row.student_id as string | null,
      academyName: academy?.name as string | undefined,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.parents + result.students > 0
          ? `푸시 ${result.parents + result.students}건 발송`
          : '연결된 수신자가 없습니다.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
