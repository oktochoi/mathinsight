import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fromDbRole } from '@/lib/roles';
import { checkAcademySubscription } from '@/lib/subscription/guard';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('academy_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.academy_id) {
      return NextResponse.json({ status: null, plan: null, daysLeft: null });
    }

    const { data: sub } = await supabaseAdmin()
      .from('academy_subscriptions')
      .select('status, plan, trial_ends_at, current_period_end')
      .eq('academy_id', profile.academy_id)
      .maybeSingle();

    const guard = await checkAcademySubscription(profile.academy_id);

    return NextResponse.json({
      status: sub?.status ?? null,
      plan: sub?.plan ?? null,
      daysLeft: guard.allowed && guard.status === 'trialing' ? guard.daysLeft : null,
      allowed: guard.allowed,
      reason: guard.allowed ? null : guard.reason,
      isOwner: fromDbRole(profile.role) === 'owner',
      trialEndsAt: sub?.trial_ends_at ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
