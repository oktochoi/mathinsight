import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { runStudentCareWorkflow } from '@/lib/workflows/studentCare';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { studentId?: string };
    if (!body.studentId?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'studentId가 필요합니다.' },
        { status: 400 }
      );
    }

    const studentId = body.studentId.trim();
    const { data: st } = await supabase
      .from('students')
      .select('academy_id')
      .eq('id', studentId)
      .maybeSingle();

    if (!st || st.academy_id !== auth.academyId) {
      return NextResponse.json({ ok: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const result = await runStudentCareWorkflow(supabase, auth.academyId, studentId, {
      staffUserId: auth.userId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
