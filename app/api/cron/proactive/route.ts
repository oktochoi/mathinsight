import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runProactiveAllAcademies } from '@/lib/agents/proactive';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.',
      },
      { status: 500 }
    );
  }

  try {
    const result = await runProactiveAllAcademies(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'cron_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
