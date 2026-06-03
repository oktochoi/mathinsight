import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { runCounselingAgent } from '@/lib/agents/counseling';

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

    const result = await runCounselingAgent(
      supabase,
      auth.academyId,
      body.studentId.trim()
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const { ok: _ok, ...payload } = result;
    return NextResponse.json({ ok: true, ...payload });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
