import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { runParentCommunicationAgent } from '@/lib/agents/parentCommunication';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { studentId?: string };
    if (!body.studentId?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'studentId가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await runParentCommunicationAgent(
      supabase,
      auth.academyId,
      body.studentId.trim()
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      draft: result.draft,
      message: '원장 승인 후 학부모 리포트 메뉴에서 저장·발송하세요.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
