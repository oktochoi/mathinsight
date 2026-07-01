import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { buildHomeworkAssignedMessage } from '@/lib/push/homeworkMessages';
import { sendPushToStudent } from '@/lib/push/studentPush';
import type { HomeworkAssignment } from '@/types/database';

type Body = {
  assignmentId?: string;
  studentIds?: string[];
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as Body;
    const assignmentId = body.assignmentId?.trim();
    if (!assignmentId) {
      return NextResponse.json({ ok: false, error: 'assignmentId가 필요합니다.' }, { status: 400 });
    }

    const { data: assignment } = await supabase
      .from('homework_assignments')
      .select('*, classes(name)')
      .eq('id', assignmentId)
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ ok: false, error: '숙제를 찾을 수 없습니다.' }, { status: 404 });
    }

    const row = assignment as HomeworkAssignment & { classes?: { name: string } | null };
    let studentIds = body.studentIds?.filter(Boolean) ?? [];

    if (studentIds.length === 0) {
      const { data: subs } = await supabase
        .from('homework_submissions')
        .select('student_id')
        .eq('assignment_id', assignmentId);
      studentIds = (subs ?? []).map((s) => s.student_id as string);
    }

    if (studentIds.length === 0) {
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', row.class_id)
        .eq('academy_id', auth.academyId)
        .eq('enrollment_status', 'active');
      studentIds = (classStudents ?? []).map((s) => s.id as string);
    }

    const { data: academy } = await supabase
      .from('academies')
      .select('name')
      .eq('id', auth.academyId)
      .maybeSingle();

    const message = buildHomeworkAssignedMessage({
      title: row.title,
      dueDate: row.due_date,
      className: row.classes?.name,
      academyName: academy?.name as string | undefined,
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const studentId of studentIds) {
      const result = await sendPushToStudent(supabase, studentId, {
        title: message.title,
        body: message.body,
        url: '/student#homework',
        category: 'homework',
      });
      if (result.skipped) skipped += 1;
      else {
        sent += result.sent;
        failed += result.failed;
      }
    }

    return NextResponse.json({
      ok: true,
      notified: studentIds.length - skipped,
      pushed: sent,
      failed,
      skipped,
      message:
        studentIds.length === 0
          ? '알림 대상 학생이 없습니다.'
          : sent > 0
            ? `학생 푸시 ${sent}건 발송`
            : '연결된 학생 앱·푸시 토큰이 없습니다.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
