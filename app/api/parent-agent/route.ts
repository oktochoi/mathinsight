import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { buildParentAgentContext } from '@/lib/parentAgentContext';
import { runParentAgent } from '@/lib/parentAgent';
import { sanitizeParentAgentHistory } from '@/lib/parentAgentSecurity';

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

    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'parent') {
      return NextResponse.json(
        { ok: false, error: '학부모 계정만 이용할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      studentId?: string;
      question?: string;
      history?: unknown;
    };

    if (!body.studentId || !body.question?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'studentId와 question이 필요합니다.' },
        { status: 400 }
      );
    }

    const studentId = body.studentId.trim();

    const { data: link } = await supabase
      .from('student_connections')
      .select('id, student_id')
      .eq('student_id', studentId)
      .eq('user_id', user.id)
      .in('relationship', ['mother', 'father', 'guardian'])
      .maybeSingle();

    if (!link || link.student_id !== studentId) {
      return NextResponse.json(
        { ok: false, error: '연결된 자녀만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    const ctx = await buildParentAgentContext(supabase, studentId);
    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: '학생 데이터를 불러오지 못했습니다.' },
        { status: 500 }
      );
    }

    if (ctx.studentId !== studentId) {
      return NextResponse.json(
        { ok: false, error: '학생 데이터가 일치하지 않습니다.' },
        { status: 500 }
      );
    }

    const result = await runParentAgent(
      body.question.trim(),
      ctx,
      sanitizeParentAgentHistory(body.history)
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      answer: result.answer,
      source: result.source,
      fallbackReason: result.fallbackReason,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
