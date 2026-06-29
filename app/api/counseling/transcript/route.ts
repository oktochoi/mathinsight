import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
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
      sessionId?: string;
      transcript?: string;
      mode?: 'summarize' | 'save_manual';
    };

    if (!body.sessionId?.trim()) {
      return NextResponse.json({ ok: false, error: 'sessionId가 필요합니다.' }, { status: 400 });
    }

    const { data: session } = await supabase
      .from('counseling_sessions')
      .select('id, academy_id, title, summary, transcript')
      .eq('id', body.sessionId.trim())
      .maybeSingle();

    if (!session || session.academy_id !== auth.academyId) {
      return NextResponse.json({ ok: false, error: '상담을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (body.mode === 'save_manual') {
      const text = body.transcript?.trim();
      if (!text) {
        return NextResponse.json({ ok: false, error: '전사 내용이 필요합니다.' }, { status: 400 });
      }
      const { error } = await supabase
        .from('counseling_sessions')
        .update({
          transcript: text,
          transcript_source: 'manual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, transcript: text, source: 'manual' });
    }

    const raw = body.transcript?.trim() || session.transcript?.trim();
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: '전사·녹취 메모를 먼저 입력해 주세요.' },
        { status: 400 }
      );
    }

    const prompt = `다음은 학원 상담 녹취/메모입니다. 상담 제목: ${session.title}

전사:
${raw.slice(0, 8000)}

요구사항:
- 5~8문장 한국어 요약 (학부모·강사 공유용)
- 핵심 이슈, 합의 사항, 후속 조치를 bullet 없이 문단으로
- 추측하지 말고 전사에 있는 내용만`;

    let summary = '';
    try {
      const { text } = await generateWithGemini(prompt);
      summary = text.trim();
    } catch {
      summary = raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
    }

    const { error } = await supabase
      .from('counseling_sessions')
      .update({
        transcript: raw,
        transcript_source: 'ai_summary',
        summary: summary || session.summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, summary, transcript: raw, source: 'ai_summary' });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
