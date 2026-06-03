import type { SupabaseClient } from '@supabase/supabase-js';
import { assessStudentRisk, KIND_LABELS, type RiskDisplayKind } from '@/lib/studentRisk';
import { logAgentRun } from '@/lib/agents/log';
import type {
  ConsultationCard,
  ConsultationFollowup,
  LessonLog,
  StoredRiskLevel,
  Student,
} from '@/types/database';

function kindToStored(level: RiskDisplayKind): StoredRiskLevel {
  return level;
}

export async function runRiskDetectionAgent(
  supabase: SupabaseClient,
  academyId: string
): Promise<{ processed: number; error?: string }> {
  await logAgentRun(supabase, {
    academyId,
    agentType: 'risk_detection',
    status: 'running',
    action: 'academy_risk_scan',
  });

  const { data: students, error: stErr } = await supabase
    .from('students')
    .select('id, name, grade, academy_id')
    .eq('academy_id', academyId);

  if (stErr || !students?.length) {
    await logAgentRun(supabase, {
      academyId,
      agentType: 'risk_detection',
      status: 'failed',
      action: 'academy_risk_scan',
      result: { error: stErr?.message ?? 'no_students' },
    });
    return { processed: 0, error: stErr?.message };
  }

  const studentIds = students.map((s) => s.id);
  const [logsRes, cardsRes, followRes] = await Promise.all([
    supabase
      .from('lesson_logs')
      .select('*')
      .in('student_id', studentIds)
      .order('lesson_date', { ascending: false })
      .limit(800),
    supabase
      .from('consultation_cards')
      .select('*')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false }),
    supabase.from('consultation_followups').select('*').in('student_id', studentIds),
  ]);

  const allLogs = (logsRes.data ?? []) as LessonLog[];
  const allCards = (cardsRes.data ?? []) as ConsultationCard[];
  const allFollowups = (followRes.data ?? []) as ConsultationFollowup[];

  let processed = 0;
  const summary: Record<string, number> = {};

  for (const st of students as Student[]) {
    const logs = allLogs.filter((l) => l.student_id === st.id);
    const cards = allCards.filter((c) => c.student_id === st.id);
    const followups = allFollowups.filter((f) => f.student_id === st.id);
    const lastCompleted =
      cards.find((c) => c.consultation_status === 'completed') ?? cards[0];

    const assessment = assessStudentRisk(logs, {
      followups,
      lastCard: lastCompleted,
    });

    const riskLevel = kindToStored(assessment.kind);
    summary[riskLevel] = (summary[riskLevel] ?? 0) + 1;

    const reason =
      assessment.signals.map((s) => s.label).join(' · ') ||
      KIND_LABELS[assessment.kind];

    await supabase.from('student_risk_signals').insert({
      academy_id: academyId,
      student_id: st.id,
      risk_level: riskLevel,
      reason,
      signals: assessment.signals,
    });

    processed += 1;
  }

  await logAgentRun(supabase, {
    academyId,
    agentType: 'risk_detection',
    status: 'completed',
    action: 'academy_risk_scan',
    result: { processed, summary },
  });

  return { processed };
}

export async function fetchLatestRiskByAcademy(
  supabase: SupabaseClient,
  academyId: string
) {
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('academy_id', academyId);

  if (!students?.length) return [];

  const ids = students.map((s) => s.id);
  const { data: signals } = await supabase
    .from('student_risk_signals')
    .select('*, students(id, name, grade)')
    .in('student_id', ids)
    .order('created_at', { ascending: false });

  if (!signals?.length) return [];

  const latest = new Map<string, (typeof signals)[0]>();
  for (const row of signals) {
    if (!latest.has(row.student_id)) latest.set(row.student_id, row);
  }
  return [...latest.values()];
}
