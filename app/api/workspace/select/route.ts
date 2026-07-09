import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { applyWorkspaceContext, fetchActiveWorkspaces } from '@/lib/workspace/memberships';
import { homeForMembershipRole, WORKSPACE_COOKIE } from '@/lib/workspace/types';

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

    const body = (await request.json()) as { membershipId?: string };
    if (!body.membershipId?.trim()) {
      return NextResponse.json({ ok: false, error: 'membershipId가 필요합니다.' }, { status: 400 });
    }

    const memberships = await fetchActiveWorkspaces(supabase, user.id);
    const picked = memberships.find((m) => m.id === body.membershipId);
    if (!picked) {
      return NextResponse.json({ ok: false, error: '워크스페이스를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { error } = await applyWorkspaceContext(supabase, user.id, picked);
    if (error) {
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    const response = NextResponse.json({
      ok: true,
      path: homeForMembershipRole(picked.role),
    });
    response.cookies.set(WORKSPACE_COOKIE, picked.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
