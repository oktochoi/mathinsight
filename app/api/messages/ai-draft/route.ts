import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { assertStaffStudentAccess } from '@/lib/ai/staffStudentAccess';
import { retrieveStudentRagContext } from '@/lib/rag/retrieve';
import { generateWithGemini } from '@/lib/ai/gemini';
import { prompts, SYSTEM_INSTRUCTION } from '@/lib/ai/prompts';
import { TASK_GEMINI_CONFIG } from '@/lib/ai/taskConfig';
import { AI_LIMITS, guardAiOutput, sanitizeApiError, sanitizeUserText } from '@/lib/ai/security';
import { checkAiQuota, logAiGenerate } from '@/lib/aiUsage';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const quota = await checkAiQuota(supabase, auth.academyId);
    if (!quota.allowed) {
      return NextResponse.json(
        { ok: false, error: `이번 달 AI 사용 한도(${quota.quota}회)에 도달했습니다.` },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      studentId?: string;
      subject?: string;
      question?: string;
    };

    if (!body.studentId?.trim() || !body.question?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'studentId와 question이 필요합니다.' },
        { status: 400 }
      );
    }

    const studentId = body.studentId.trim();
    const access = await assertStaffStudentAccess(supabase, auth, studentId);
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const question = sanitizeUserText(body.question, AI_LIMITS.question);
    const subject = sanitizeUserText(body.subject ?? '', 200);

    const rag = await retrieveStudentRagContext(supabase, studentId, question);
    if (!rag) {
      return NextResponse.json({ ok: false, error: '학생 데이터를 불러오지 못했습니다.' }, { status: 500 });
    }

    const { data: st } = await supabase
      .from('students')
      .select('name, grade')
      .eq('id', studentId)
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    const cfg = TASK_GEMINI_CONFIG.messageDraft;
    const prompt = prompts.messageDraft({
      studentName: (st?.name as string) ?? '학생',
      grade: (st?.grade as string) ?? undefined,
      subject,
      question,
      contextText: rag.contextText.slice(0, 6000),
    });

    try {
      const { text } = await generateWithGemini(prompt, {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: cfg.temperature,
        maxOutputTokens: cfg.maxOutputTokens,
      });
      await logAiGenerate(supabase, auth.academyId, 'messageDraft');
      return NextResponse.json({ ok: true, source: 'gemini', draft: guardAiOutput(text) });
    } catch {
      return NextResponse.json({
        ok: true,
        source: 'rules',
        draft: `안녕하세요. ${(st?.name as string) ?? '학생'} 학부모님, 문의 주셔서 감사합니다. 최근 수업 기록을 확인한 뒤 상세히 안내드리겠습니다. 추가 문의는 학원으로 연락 주세요.`,
      });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: sanitizeApiError(e) }, { status: 500 });
  }
}
