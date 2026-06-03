import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { fetchLatestAgentLogs } from '@/lib/agents/log';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const limit = Number(new URL(request.url).searchParams.get('limit') ?? '30');
    const logs = await fetchLatestAgentLogs(supabase, auth.academyId, Math.min(limit, 50));

    return NextResponse.json({ ok: true, logs });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
