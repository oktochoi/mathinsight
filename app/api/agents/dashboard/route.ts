import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { buildDashboardAgentInsight } from '@/lib/agents/dashboard';
import { runRiskDetectionAgent } from '@/lib/agents/riskDetection';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const refreshRisk = searchParams.get('refreshRisk') === '1';

    if (refreshRisk) {
      await runRiskDetectionAgent(supabase, auth.academyId);
    }

    const insight = await buildDashboardAgentInsight(supabase, auth.academyId);
    return NextResponse.json({ ok: true, insight });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
