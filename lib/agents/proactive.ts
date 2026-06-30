import type { SupabaseClient } from '@supabase/supabase-js';
import { runRiskDetectionAgent } from '@/lib/agents/riskDetection';
import { runAcademyProactiveWorkflow } from '@/lib/workflows/studentCare';
import { logAgentRun } from '@/lib/agents/log';
import { indexStudentMemory } from '@/lib/vectorRag/indexStudent';
import { notifyAgentFailure } from '@/lib/notifyAgentFailure';

export async function runProactiveAcademyScan(
  supabase: SupabaseClient,
  academyId: string
): Promise<{
  riskProcessed: number;
  workflowsRun: number;
  indexedStudents: number;
  errors: string[];
}> {
  await logAgentRun(supabase, {
    academyId,
    agentType: 'risk_detection',
    status: 'running',
    action: 'proactive_daily_scan',
  });

  const { processed, error } = await runRiskDetectionAgent(supabase, academyId);
  const errors: string[] = error ? [error] : [];
  if (error) {
    await notifyAgentFailure(`proactive scan (academy ${academyId})`, error);
  }

  const { data: atRisk } = await supabase
    .from('student_risk_signals')
    .select('student_id')
    .eq('academy_id', academyId)
    .in('risk_level', ['consultation', 'makeup', 'attention'])
    .order('created_at', { ascending: false });

  const studentIds = [...new Set((atRisk ?? []).map((r) => r.student_id as string))];
  let indexedStudents = 0;
  for (const sid of studentIds.slice(0, 20)) {
    const idx = await indexStudentMemory(supabase, sid);
    if (idx.ok) indexedStudents += 1;
  }

  const workflow = await runAcademyProactiveWorkflow(supabase, academyId);
  if (workflow.errors.length > 0) {
    await notifyAgentFailure(
      `proactive workflow (academy ${academyId})`,
      workflow.errors.join('; ')
    );
  }

  await logAgentRun(supabase, {
    academyId,
    agentType: 'dashboard',
    status: 'completed',
    action: 'proactive_daily_complete',
    result: {
      riskProcessed: processed,
      workflowsRun: workflow.workflowsRun,
      indexedStudents,
    },
  });

  return {
    riskProcessed: processed,
    workflowsRun: workflow.workflowsRun,
    indexedStudents,
    errors: [...errors, ...workflow.errors],
  };
}

export async function runProactiveAllAcademies(
  supabase: SupabaseClient
): Promise<{ academies: number; summary: Record<string, unknown> }> {
  const { data: academies } = await supabase.from('academies').select('id');
  const results: Record<string, unknown> = {};

  for (const a of academies ?? []) {
    const id = a.id as string;
    results[id] = await runProactiveAcademyScan(supabase, id);
  }

  return { academies: academies?.length ?? 0, summary: results };
}
