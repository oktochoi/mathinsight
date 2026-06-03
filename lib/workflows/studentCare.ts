import type { SupabaseClient } from '@supabase/supabase-js';
import { runRiskDetectionAgent } from '@/lib/agents/riskDetection';
import { runCounselingAgent } from '@/lib/agents/counseling';
import { runParentCommunicationAgent } from '@/lib/agents/parentCommunication';
import { logAgentRun } from '@/lib/agents/log';
import { indexStudentMemory } from '@/lib/vectorRag/indexStudent';
import type { StoredRiskLevel } from '@/types/database';

const TRIGGER_LEVELS: StoredRiskLevel[] = ['consultation', 'makeup'];

export type WorkflowStep =
  | 'risk_detection'
  | 'counseling'
  | 'parent_communication'
  | 'completed';

async function upsertJob(
  supabase: SupabaseClient,
  params: {
    jobId?: string;
    academyId: string;
    studentId: string;
    currentStep: WorkflowStep;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: Record<string, unknown>;
  }
): Promise<string> {
  if (params.jobId) {
    await supabase
      .from('agent_jobs')
      .update({
        current_step: params.currentStep,
        status: params.status,
        result: params.result ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.jobId);
    return params.jobId;
  }

  const { data } = await supabase
    .from('agent_jobs')
    .insert({
      academy_id: params.academyId,
      student_id: params.studentId,
      workflow_type: 'student_care',
      current_step: params.currentStep,
      status: params.status,
      result: params.result ?? null,
    })
    .select('id')
    .single();

  return data?.id as string;
}

async function getLatestRiskLevel(
  supabase: SupabaseClient,
  studentId: string
): Promise<StoredRiskLevel | null> {
  const { data } = await supabase
    .from('student_risk_signals')
    .select('risk_level')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.risk_level as StoredRiskLevel) ?? null;
}

async function saveAutoConsultationCard(
  supabase: SupabaseClient,
  studentId: string,
  counseling: {
    summary: string;
    mainIssues: string[];
    consultationPoints: string[];
    recommendedActions: string[];
  },
  staffUserId?: string | null
): Promise<string | null> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);

  const { data, error } = await supabase
    .from('consultation_cards')
    .insert({
      student_id: studentId,
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      learning_summary: counseling.summary,
      evidence_summary: counseling.mainIssues.join('\n'),
      consultation_points: counseling.consultationPoints,
      parent_message: counseling.recommendedActions.join('\n'),
      consultation_status: 'pending',
      generated_by: staffUserId ?? null,
    })
    .select('id')
    .single();

  if (error) return null;
  return data?.id as string;
}

async function saveAutoParentReport(
  supabase: SupabaseClient,
  studentId: string,
  draft: { periodStart: string; periodEnd: string; reportText: string },
  staffUserId?: string | null
): Promise<string | null> {
  const { data, error } = await supabase
    .from('parent_reports')
    .insert({
      student_id: studentId,
      period_start: draft.periodStart,
      period_end: draft.periodEnd,
      tone: 'friendly',
      report_text: `${draft.reportText}\n\n[Agent 초안 — 원장 확인 후 발송]`,
      generated_by: staffUserId ?? null,
    })
    .select('id')
    .single();

  if (error) return null;
  return data?.id as string;
}

/**
 * Risk → Counseling → Parent Communication 연결 워크플로
 */
export async function runStudentCareWorkflow(
  supabase: SupabaseClient,
  academyId: string,
  studentId: string,
  options?: { staffUserId?: string; skipRiskScan?: boolean }
): Promise<{
  jobId: string;
  triggered: boolean;
  steps: string[];
  error?: string;
}> {
  const steps: string[] = [];
  let jobId = await upsertJob(supabase, {
    academyId,
    studentId,
    currentStep: 'risk_detection',
    status: 'running',
  });

  try {
    if (!options?.skipRiskScan) {
      await runRiskDetectionAgent(supabase, academyId);
      steps.push('risk_detection');
    }

    const riskLevel = await getLatestRiskLevel(supabase, studentId);
    const triggered = riskLevel != null && TRIGGER_LEVELS.includes(riskLevel);

    if (!triggered) {
      jobId = await upsertJob(supabase, {
        jobId,
        academyId,
        studentId,
        currentStep: 'completed',
        status: 'completed',
        result: { triggered: false, riskLevel },
      });
      return { jobId, triggered: false, steps };
    }

    await indexStudentMemory(supabase, studentId);

    jobId = await upsertJob(supabase, {
      jobId,
      academyId,
      studentId,
      currentStep: 'counseling',
      status: 'running',
    });

    const counseling = await runCounselingAgent(supabase, academyId, studentId);
    if (!counseling.ok) {
      throw new Error(counseling.error);
    }
    steps.push('counseling');

    const cardId = await saveAutoConsultationCard(
      supabase,
      studentId,
      counseling,
      options?.staffUserId
    );

    jobId = await upsertJob(supabase, {
      jobId,
      academyId,
      studentId,
      currentStep: 'parent_communication',
      status: 'running',
      result: { consultationCardId: cardId },
    });

    const report = await runParentCommunicationAgent(supabase, academyId, studentId);
    if (!report.ok) {
      throw new Error(report.error);
    }
    steps.push('parent_communication');

    const reportId = await saveAutoParentReport(
      supabase,
      studentId,
      report.draft,
      options?.staffUserId
    );

    jobId = await upsertJob(supabase, {
      jobId,
      academyId,
      studentId,
      currentStep: 'completed',
      status: 'completed',
      result: {
        triggered: true,
        riskLevel,
        consultationCardId: cardId,
        parentReportId: reportId,
      },
    });

    await logAgentRun(supabase, {
      academyId,
      agentType: 'dashboard',
      studentId,
      status: 'completed',
      action: 'workflow_student_care',
      result: { steps, cardId, reportId },
    });

    return { jobId, triggered: true, steps };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'workflow_failed';
    await upsertJob(supabase, {
      jobId,
      academyId,
      studentId,
      currentStep: 'completed',
      status: 'failed',
      result: { error: message, steps },
    });
    return { jobId, triggered: false, steps, error: message };
  }
}

/** 학원 전체: 위험 학생에 대해 워크플로 일괄 실행 */
export async function runAcademyProactiveWorkflow(
  supabase: SupabaseClient,
  academyId: string,
  staffUserId?: string
): Promise<{ workflowsRun: number; errors: string[] }> {
  await runRiskDetectionAgent(supabase, academyId);

  const { data: signals } = await supabase
    .from('student_risk_signals')
    .select('student_id, risk_level')
    .eq('academy_id', academyId)
    .in('risk_level', TRIGGER_LEVELS)
    .order('created_at', { ascending: false });

  const seen = new Set<string>();
  const studentIds: string[] = [];
  for (const row of signals ?? []) {
    if (!seen.has(row.student_id)) {
      seen.add(row.student_id);
      studentIds.push(row.student_id);
    }
  }

  let workflowsRun = 0;
  const errors: string[] = [];

  for (const studentId of studentIds.slice(0, 10)) {
    const res = await runStudentCareWorkflow(supabase, academyId, studentId, {
      staffUserId,
      skipRiskScan: true,
    });
    if (res.triggered) workflowsRun += 1;
    if (res.error) errors.push(`${studentId}: ${res.error}`);
  }

  return { workflowsRun, errors };
}
