import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_DAILY_QUOTA = 200;

export function getAiDailyQuota(): number {
  const raw = process.env.AI_DAILY_QUOTA_PER_ACADEMY?.trim();
  const n = raw ? parseInt(raw, 10) : DEFAULT_DAILY_QUOTA;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_QUOTA;
}

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getAcademyAiUsageToday(
  supabase: SupabaseClient,
  academyId: string
): Promise<number> {
  const { count } = await supabase
    .from('agent_logs')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('action', 'ai_generate')
    .gte('created_at', todayStartIso());
  return count ?? 0;
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

export async function checkAiQuota(
  supabase: SupabaseClient,
  academyId: string
): Promise<{ allowed: boolean; used: number; quota: number }> {
  const quota = getAiDailyQuota();
  const used = await getAcademyAiUsageToday(supabase, academyId);
  return { allowed: used < quota, used, quota };
}
