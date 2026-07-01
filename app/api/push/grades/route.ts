import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { buildExamScoreMessage, buildLessonScoreMessage } from '@/lib/push/gradeMessages';
import { sendPushToStudentParents } from '@/lib/push/parentPush';

type ExamItem = { studentId: string; score: number; previousScore?: number | null };
type Body =
  | { type: 'exam'; examId: string; items: ExamItem[] }
  | { type: 'lesson'; studentId: string; score: number; lessonDate: string; unit?: string };

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as Body;

    const { data: academy } = await supabase
      .from('academies')
      .select('name')
      .eq('id', auth.academyId)
      .maybeSingle();
    const academyName = academy?.name as string | undefined;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    if (body.type === 'exam') {
      const examId = body.examId?.trim();
      const items = body.items ?? [];
      if (!examId || items.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'examId와 items가 필요합니다.' },
          { status: 400 }
        );
      }

      const { data: exam } = await supabase
        .from('exams')
        .select('name, max_score')
        .eq('id', examId)
        .eq('academy_id', auth.academyId)
        .maybeSingle();

      if (!exam) {
        return NextResponse.json({ ok: false, error: '시험을 찾을 수 없습니다.' }, { status: 404 });
      }

      for (const item of items) {
        const message = buildExamScoreMessage({
          examName: exam.name as string,
          score: item.score,
          maxScore: exam.max_score as number,
          previousScore: item.previousScore,
          academyName,
        });

        const result = await sendPushToStudentParents(supabase, {
          studentId: item.studentId,
          title: message.title,
          body: message.body,
          url: '/parent#grades',
          category: 'grades',
        });

        if (result.skipped) skipped += 1;
        else {
          sent += result.sent;
          failed += result.failed;
        }
      }
    } else if (body.type === 'lesson') {
      const { studentId, score, lessonDate, unit } = body;
      if (!studentId?.trim() || score == null || !lessonDate?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'studentId, score, lessonDate가 필요합니다.' },
          { status: 400 }
        );
      }

      const message = buildLessonScoreMessage({
        unit: unit ?? '수업',
        score,
        lessonDate,
        academyName,
      });

      const result = await sendPushToStudentParents(supabase, {
        studentId: studentId.trim(),
        title: message.title,
        body: message.body,
        url: '/parent#grades',
        category: 'grades',
      });

      if (result.skipped) skipped += 1;
      else {
        sent += result.sent;
        failed += result.failed;
      }
    } else {
      return NextResponse.json({ ok: false, error: 'type이 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      pushed: sent,
      failed,
      skipped,
      message: sent > 0 ? `학부모 푸시 ${sent}건 발송` : '연결된 학부모·푸시 토큰이 없습니다.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
