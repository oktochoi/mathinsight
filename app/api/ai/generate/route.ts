import { NextResponse } from 'next/server';
import { runAiGenerate, type AiGenerateInput } from '@/lib/ai/generate';
import type { AiPromptTask } from '@/lib/ai/prompts';
import type { ReportTone } from '@/types/database';

const TASKS: AiPromptTask[] = [
  'learningSummary',
  'evidenceSummary',
  'consultationPoints',
  'parentMessage',
  'parentReport',
];

const TONES: ReportTone[] = ['friendly', 'objective', 'exam_focused', 'encouraging'];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AiGenerateInput>;

    if (!body.task || !TASKS.includes(body.task)) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 task입니다.' }, { status: 400 });
    }

    if (!body.student?.name || !body.periodStart || !body.periodEnd || !body.academyName) {
      return NextResponse.json(
        { ok: false, error: 'student, period, academyName이 필요합니다.' },
        { status: 400 }
      );
    }

    if (body.task === 'parentReport' && body.tone && !TONES.includes(body.tone)) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 tone입니다.' }, { status: 400 });
    }

    const result = await runAiGenerate({
      task: body.task,
      logs: Array.isArray(body.logs) ? body.logs : [],
      student: body.student,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      academyName: body.academyName,
      tone: body.tone,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      source: result.source,
      text: result.text,
      points: result.points,
      backend: result.source === 'gemini' ? result.backend : undefined,
      fallbackReason:
        result.source === 'rules' ? result.fallbackReason : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
