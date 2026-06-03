import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { data: jobs } = await supabase
      .from('agent_jobs')
      .select('*, students(id, name, grade)')
      .eq('academy_id', auth.academyId)
      .order('updated_at', { ascending: false })
      .limit(15);

    return NextResponse.json({ ok: true, jobs: jobs ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
