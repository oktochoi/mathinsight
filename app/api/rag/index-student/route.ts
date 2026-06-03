import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { indexStudentMemory } from '@/lib/vectorRag/indexStudent';

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

    const { data: st } = await supabase
      .from('students')
      .select('academy_id')
      .eq('id', body.studentId.trim())
      .maybeSingle();

    if (!st || st.academy_id !== auth.academyId) {
      return NextResponse.json({ ok: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    const result = await indexStudentMemory(supabase, body.studentId.trim());
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
