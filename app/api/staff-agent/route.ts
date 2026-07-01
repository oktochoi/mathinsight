import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { runStaffAgent, type StaffAgentChatMessage } from '@/lib/staffAgent';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      question?: string;
      history?: StaffAgentChatMessage[];
    };

    if (!body.question?.trim()) {
      return NextResponse.json({ ok: false, error: 'question이 필요합니다.' }, { status: 400 });
    }

    const result = await runStaffAgent(body.question.trim(), body.history ?? []);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, answer: result.answer, source: result.source });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
