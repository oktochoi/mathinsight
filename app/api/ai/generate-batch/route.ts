import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { checkAiQuota, logAiGenerate } from '@/lib/aiUsage';
import { runAiGenerateBatch } from '@/lib/ai/generate';
import { loadStudentAiContext } from '@/lib/ai/loadStudentAiContext';
import { CONSULTATION_CARD_TASKS } from '@/lib/ai/taskConfig';
import type { AiGenerateResult } from '@/lib/ai/generate';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function packResult(r: AiGenerateResult) {
  if (!r.ok) return null;
  return {
    text: r.text,
    source: r.source,
    points: r.points,
    fallbackReason: r.source === 'rules' ? r.fallbackReason : undefined,
    backend: r.source === 'gemini' ? r.backend : undefined,
  };
}

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
      periodStart?: string;
      periodEnd?: string;
    };

    if (!body.studentId?.trim() || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { ok: false, error: 'studentId, periodStart, periodEnd가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!DATE_RE.test(body.periodStart) || !DATE_RE.test(body.periodEnd)) {
      return NextResponse.json({ ok: false, error: '기간 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const loaded = await loadStudentAiContext(supabase, auth, {
      studentId: body.studentId.trim(),
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
    });

    if (!loaded.ok) {
      return NextResponse.json({ ok: false, error: loaded.error }, { status: loaded.status });
    }

    if (loaded.ctx.logs.length === 0) {
      return NextResponse.json(
        { ok: false, error: '해당 기간에 수업 기록이 없습니다.' },
        { status: 400 }
      );
    }

    const { student, logs, academyName } = loaded.ctx;

    const batch = await runAiGenerateBatch({
      logs,
      student: { name: student.name, grade: student.grade },
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      academyName,
    });

    if (!batch.learningSummary.ok && !batch.evidenceSummary.ok) {
      const err =
        (!batch.learningSummary.ok && batch.learningSummary.error) ||
        (!batch.evidenceSummary.ok && batch.evidenceSummary.error) ||
        '생성에 실패했습니다.';
      return NextResponse.json({ ok: false, error: err }, { status: 500 });
    }

    for (const task of CONSULTATION_CARD_TASKS) {
      await logAiGenerate(supabase, auth.academyId, task);
    }

    return NextResponse.json({
      ok: true,
      learningSummary: packResult(batch.learningSummary),
      evidenceSummary: packResult(batch.evidenceSummary),
      consultationPoints: packResult(batch.consultationPoints),
      parentMessage: packResult(batch.parentMessage),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
