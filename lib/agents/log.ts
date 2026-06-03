import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentLogStatus, AgentType } from '@/types/database';

export async function logAgentRun(
  supabase: SupabaseClient,
  params: {
    academyId: string;
    agentType: AgentType;
    studentId?: string | null;
    status: AgentLogStatus;
    action: string;
    result?: Record<string, unknown> | null;
  }
): Promise<void> {
  await supabase.from('agent_logs').insert({
    academy_id: params.academyId,
    agent_type: params.agentType,
    student_id: params.studentId ?? null,
    status: params.status,
    action: params.action,
    result: params.result ?? null,
  });
}

export async function fetchLatestAgentLogs(
  supabase: SupabaseClient,
  academyId: string,
  limit = 20
) {
  const { data } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
