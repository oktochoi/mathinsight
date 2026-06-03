import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchLatestAgentLogs, logAgentRun } from '@/lib/agents/log';
import { fetchLatestRiskByAcademy } from '@/lib/agents/riskDetection';
import { KIND_LABELS, riskNeedsStaffAction } from '@/lib/studentRisk';
import type { AgentLogStatus, AgentType, DashboardAgentInsight, StoredRiskLevel } from '@/types/database';

const AGENT_LABELS: Record<AgentType, string> = {
  risk_detection: '학습 위험 점검',
  counseling: '상담 카드 준비',
  parent_communication: '학부모 리포트',
  dashboard: '대시보드 정리',
  parent_rag: '학부모 AI 상담',
};

function riskLabel(level: StoredRiskLevel): string {
  return KIND_LABELS[level] ?? level;
}

export async function buildDashboardAgentInsight(
  supabase: SupabaseClient,
  academyId: string
): Promise<DashboardAgentInsight> {
  const signals = await fetchLatestRiskByAcademy(supabase, academyId);

  const consultationStudents: DashboardAgentInsight['consultationStudents'] = [];
  const makeupStudents: DashboardAgentInsight['makeupStudents'] = [];
  const parentContactStudents: DashboardAgentInsight['parentContactStudents'] = [];
  const riskSummary: DashboardAgentInsight['riskSummary'] = {
    stable: 0,
    recovering: 0,
    consultation: 0,
    makeup: 0,
    attention: 0,
  };

  for (const row of signals) {
    const level = row.risk_level as keyof typeof riskSummary;
    if (level in riskSummary) riskSummary[level] += 1;

    const st = row.students as { id: string; name: string; grade: string } | null;
    if (!st) continue;
    const entry = { id: st.id, name: st.name, grade: st.grade, reason: row.reason };
    if (row.risk_level === 'consultation') consultationStudents.push(entry);
    else if (row.risk_level === 'makeup') makeupStudents.push(entry);
    else if (row.risk_level === 'attention') parentContactStudents.push(entry);
  }

  const priorityExplanation = `양호 ${riskSummary.stable}명 · 회복 ${riskSummary.recovering}명 · 상담 ${riskSummary.consultation}명 · 보강 ${riskSummary.makeup}명 · 주의 ${riskSummary.attention}명 (수업 기록 자동 분석)`;

  const logs = await fetchLatestAgentLogs(supabase, academyId, 40);
  const agentTypes: AgentType[] = [
    'risk_detection',
    'counseling',
    'parent_communication',
    'dashboard',
  ];

  const agentStatuses = agentTypes.map((agentType) => {
    const last = logs.find((l) => l.agent_type === agentType);
    return {
      agentType,
      label: AGENT_LABELS[agentType],
      status: (last?.status as AgentLogStatus) ?? 'pending',
      lastRunAt: last?.created_at ?? null,
    };
  });

  await logAgentRun(supabase, {
    academyId,
    agentType: 'dashboard',
    status: 'completed',
    action: 'build_action_center',
    result: {
      consultation: consultationStudents.length,
      makeup: makeupStudents.length,
      parentContact: parentContactStudents.length,
    },
  });

  return {
    consultationStudents: consultationStudents.slice(0, 8),
    makeupStudents: makeupStudents.slice(0, 8),
    parentContactStudents: parentContactStudents.slice(0, 8),
    riskSummary,
    priorityExplanation,
    agentStatuses,
  };
}

export { riskNeedsStaffAction };
