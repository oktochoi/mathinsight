import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { generateWithGemini } from '@/lib/ai/gemini';
import { prompts, SYSTEM_INSTRUCTION } from '@/lib/ai/prompts';
import { TASK_GEMINI_CONFIG } from '@/lib/ai/taskConfig';
import { AI_LIMITS, guardAiOutput, sanitizeApiError, sanitizeUserText } from '@/lib/ai/security';

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
      const text = sanitizeUserText(body.transcript ?? '', AI_LIMITS.transcript);
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

    const raw = sanitizeUserText(
      body.transcript?.trim() || session.transcript?.trim() || '',
      AI_LIMITS.transcript
    );
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: '전사·녹취 메모를 먼저 입력해 주세요.' },
        { status: 400 }
      );
    }

    const cfg = TASK_GEMINI_CONFIG.counselingSummary;
    const prompt = prompts.counselingSummary({
      title: session.title as string,
      transcript: raw,
    });

    let summary = '';
    try {
      const { text } = await generateWithGemini(prompt, {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: cfg.temperature,
        maxOutputTokens: cfg.maxOutputTokens,
      });
      summary = guardAiOutput(text);
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
    return NextResponse.json({ ok: false, error: sanitizeApiError(e) }, { status: 500 });
  }
}
