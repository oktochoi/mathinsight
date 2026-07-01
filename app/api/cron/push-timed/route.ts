import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runTimedPushReminders } from '@/lib/push/timedReminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** 15분마다 — 수업 30분 전 · 상담 1시간 전 · 상담 전날 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY가 필요합니다.' },
      { status: 500 }
    );
  }

  try {
    const result = await runTimedPushReminders(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'cron_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
