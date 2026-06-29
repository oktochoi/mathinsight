import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { retrieveStudentRagContext } from '@/lib/rag/retrieve';
import { generateWithGemini } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
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
    const rag = await retrieveStudentRagContext(supabase, studentId, body.question.trim());
    if (!rag) {
      return NextResponse.json({ ok: false, error: '학생 데이터를 불러오지 못했습니다.' }, { status: 500 });
    }

    const { data: st } = await supabase
      .from('students')
      .select('name, grade')
      .eq('id', studentId)
      .maybeSingle();

    const prompt = `당신은 학원 원장/강사입니다. 학부모 문의에 답변 초안을 작성하세요.
학생: ${st?.name ?? '학생'} (${st?.grade ?? ''})
문의 제목: ${body.subject ?? '(제목 없음)'}
문의 내용:
${body.question.trim()}

참고 학습 데이터:
${rag.contextText.slice(0, 6000)}

요구사항:
- 정중하고 간결한 한국어
- 학습 데이터에 근거한 사실만 (추측 금지)
- 3~6문장, 학부모가 이해하기 쉽게
- 마지막에 「추가 문의는 학원으로 연락 주세요」 한 줄`;

    try {
      const { text } = await generateWithGemini(prompt);
      return NextResponse.json({ ok: true, source: 'gemini', draft: text });
    } catch {
      return NextResponse.json({
        ok: true,
        source: 'rules',
        draft: `안녕하세요. ${st?.name ?? '학생'} 학부모님, 문의 주셔서 감사합니다. 최근 수업 기록을 확인한 뒤 상세히 안내드리겠습니다. 추가 문의는 학원으로 연락 주세요.`,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
