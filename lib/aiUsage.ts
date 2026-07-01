import type { SupabaseClient } from '@supabase/supabase-js';

const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  free: 10,
  starter: 100,
  growth: 500,
  pro: 50_000,
};

const DEFAULT_MONTHLY = 100;

function monthStartKstIso(): string {
  const key = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }).slice(0, 7);
  return `${key}-01T00:00:00+09:00`;
}

async function monthlyLimit(admin: SupabaseClient, academyId: string): Promise<number> {
  const { data } = await admin
    .from('academy_subscriptions')
    .select('plan')
    .eq('academy_id', academyId)
    .maybeSingle();
  const plan = (data?.plan as string | undefined) ?? 'starter';
  return PLAN_MONTHLY_LIMITS[plan] ?? DEFAULT_MONTHLY;
}

export function getAiDailyQuota(): number {
  const raw = process.env.AI_DAILY_QUOTA_PER_ACADEMY?.trim();
  const n = raw ? parseInt(raw, 10) : 200;
  return Number.isFinite(n) && n > 0 ? n : 200;
}

export async function getAcademyAiUsageMonth(
  supabase: SupabaseClient,
  academyId: string
): Promise<number> {
  const { count } = await supabase
    .from('agent_logs')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .in('action', ['ai_generate', 'parent_agent'])
    .gte('created_at', monthStartKstIso());
  return count ?? 0;
}

/** @deprecated 일별 — 월별 쿼터 우선 */
export async function getAcademyAiUsageToday(
  supabase: SupabaseClient,
  academyId: string
): Promise<number> {
  return getAcademyAiUsageMonth(supabase, academyId);
}

export async function logAiGenerate(
  supabase: SupabaseClient,
  academyId: string,
  task: string
): Promise<void> {
  await supabase.from('agent_logs').insert({
    academy_id: academyId,
    agent_type: 'counseling',
    student_id: null,
    status: 'completed',
    action: 'ai_generate',
    result: { task },
  });
}

export async function logParentAgentCall(
  supabase: SupabaseClient,
  academyId: string,
  studentId: string
): Promise<void> {
  await supabase.from('agent_logs').insert({
    academy_id: academyId,
    agent_type: 'parent_communication',
    student_id: studentId,
    status: 'completed',
    action: 'parent_agent',
    result: {},
  });
}

export async function checkAiQuota(
  supabase: SupabaseClient,
  academyId: string
): Promise<{ allowed: boolean; used: number; quota: number }> {
  const quota = await monthlyLimit(supabase, academyId);
  const used = await getAcademyAiUsageMonth(supabase, academyId);
  return { allowed: used < quota, used, quota };
}
