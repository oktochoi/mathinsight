import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { checkAiQuota, logAiGenerate } from '@/lib/aiUsage';
import { runAiGenerate } from '@/lib/ai/generate';
import { loadStudentAiContext } from '@/lib/ai/loadStudentAiContext';
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
        {
          ok: false,
          error: `이번 달 AI 사용 한도(${quota.quota}회)에 도달했습니다. 플랜을 업그레이드하거나 다음 달에 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      task?: AiPromptTask;
      studentId?: string;
      periodStart?: string;
      periodEnd?: string;
      tone?: ReportTone;
    };

    if (!body.task || !TASKS.includes(body.task)) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 task입니다.' }, { status: 400 });
    }

    if (!body.studentId?.trim() || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { ok: false, error: 'studentId, periodStart, periodEnd가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!DATE_RE.test(body.periodStart) || !DATE_RE.test(body.periodEnd)) {
      return NextResponse.json({ ok: false, error: '기간 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    if (body.task === 'parentReport' && body.tone && !TONES.includes(body.tone)) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 tone입니다.' }, { status: 400 });
    }

    const loaded = await loadStudentAiContext(supabase, auth, {
      studentId: body.studentId.trim(),
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
    });

    if (!loaded.ok) {
      return NextResponse.json({ ok: false, error: loaded.error }, { status: loaded.status });
    }

    const { student, logs, academyName } = loaded.ctx;

    const result = await runAiGenerate({
      task: body.task,
      logs,
      student: { name: student.name, grade: student.grade },
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      academyName,
      tone: body.tone,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await logAiGenerate(supabase, auth.academyId, body.task);

    return NextResponse.json({
      ok: true,
      source: result.source,
      text: result.text,
      points: result.points,
      backend: result.source === 'gemini' ? result.backend : undefined,
      fallbackReason: result.source === 'rules' ? result.fallbackReason : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
