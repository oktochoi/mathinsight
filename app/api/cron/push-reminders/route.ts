import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runScheduledPushReminders } from '@/lib/push/scheduledReminders';
import { runOwnerChurnAlerts } from '@/lib/push/timedReminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** 매일 KST 오전 — 수강료 D-3·미납·재등록 D-14/7/1 학부모 푸시 */
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
    const daily = await runScheduledPushReminders(admin);
    const churn = await runOwnerChurnAlerts(admin);
    return NextResponse.json({ ok: true, ...daily, ownerChurnAlerts: churn.alerts, churnSkipped: churn.skipped });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'cron_failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
