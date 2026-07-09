import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getEmailInviteUrl } from '@/lib/invite/urls';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as { parentId?: string; studentId?: string };
    if (!body.parentId?.trim() || !body.studentId?.trim()) {
      return NextResponse.json({ ok: false, error: 'parentId, studentId가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('create_parent_invitation', {
      p_parent_id: body.parentId.trim(),
      p_student_id: body.studentId.trim(),
      p_invited_by: user.id,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      token?: string;
      invitation_id?: string;
    };

    if (!result?.ok || !result.token) {
      return NextResponse.json(
        { ok: false, error: result?.error ?? '초대 발급 실패' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      invitationId: result.invitation_id,
      inviteUrl: getEmailInviteUrl(result.token),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
