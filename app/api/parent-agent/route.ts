import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { retrieveStudentRagContext } from '@/lib/rag/retrieve';
import { checkAiQuota, logParentAgentCall } from '@/lib/aiUsage';
import { logAgentRun } from '@/lib/agents/log';
import { runParentAgent } from '@/lib/parentAgent';
import { sanitizeParentAgentHistory } from '@/lib/parentAgentSecurity';
import type { ParentAgentContextBundle } from '@/lib/parentAgentContext';

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

    if (profile?.role !== 'parent' && profile?.role !== 'student') {
      return NextResponse.json(
        { ok: false, error: '학부모·학생 계정만 이용할 수 있습니다.' },
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

    if (profile.role === 'parent') {
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
    } else {
      const { data: selfLink } = await supabase
        .from('student_connections')
        .select('student_id')
        .eq('user_id', user.id)
        .eq('relationship', 'student')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!selfLink) {
        return NextResponse.json(
          { ok: false, error: '본인 학생 정보만 조회할 수 있습니다.' },
          { status: 403 }
        );
      }
    }

    const rag = await retrieveStudentRagContext(supabase, studentId, body.question.trim());
    if (!rag) {
      return NextResponse.json(
        { ok: false, error: '학생 데이터를 불러오지 못했습니다.' },
        { status: 500 }
      );
    }

    const { data: stRow } = await supabase
      .from('students')
      .select('name, grade, academy_id, academies(name)')
      .eq('id', studentId)
      .maybeSingle();

    const academyId = stRow?.academy_id as string | undefined;
    if (academyId) {
      const quota = await checkAiQuota(supabase, academyId);
      if (!quota.allowed) {
        return NextResponse.json(
          {
            ok: false,
            error: `이번 달 AI 사용 한도(${quota.quota}회)에 도달했습니다.`,
          },
          { status: 429 }
        );
      }
    }

    const academyJoin = stRow?.academies as { name: string } | { name: string }[] | null;
    const academyName = Array.isArray(academyJoin)
      ? academyJoin[0]?.name
      : academyJoin?.name;

    // 학원 정보 (원장이 입력한 FAQ·수강료·규칙 등) 컨텍스트에 추가
    let academyInfoText = '';
    if (stRow) {
      const { data: stAcademy } = await supabase
        .from('students')
        .select('academy_id')
        .eq('id', studentId)
        .maybeSingle();
      if (stAcademy?.academy_id) {
        const { fetchAcademyInfo, serializeAcademyInfoForContext } = await import('@/lib/academyInfo');
        const infoItems = await fetchAcademyInfo(supabase, stAcademy.academy_id as string);
        academyInfoText = serializeAcademyInfoForContext(infoItems);
      }
    }

    const ctx: ParentAgentContextBundle = {
      studentId,
      studentName: (stRow?.name as string) ?? '학생',
      grade: (stRow?.grade as string) ?? '',
      academyName: academyName ?? '학원',
      contextText: academyInfoText
        ? `${rag.contextText}\n\n${academyInfoText}`
        : rag.contextText,
    };

    const result = await runParentAgent(
      body.question.trim(),
      ctx,
      sanitizeParentAgentHistory(body.history)
    );

    if (result.ok) {
      if (academyId) {
        await logParentAgentCall(supabase, academyId, studentId);
        await logAgentRun(supabase, {
          academyId,
          agentType: 'parent_rag',
          studentId,
          status: 'completed',
          action: 'parent_question',
          result: { rag: rag.meta, source: result.source },
        });
      }
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      answer: result.answer,
      source: result.source,
      fallbackReason: result.fallbackReason,
      ragMode: rag.mode ?? 'keyword',
      citations: rag.citations ?? [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
