import { supabase } from '@/lib/supabase';
import type { RetentionRiskLevel, RetentionSignal, ReregistrationRecord, StudentRiskSnapshot } from '@/types/database';

/** retention 스냅샷 — ERP 우선, legacy 폴백 */
export async function fetchLatestRetentionSnapshots(academyId: string) {
  const { data, error } = await supabase
    .from('student_risk_snapshots')
    .select('*, students(id, name, grade)')
    .eq('academy_id', academyId)
    .eq('snapshot_type', 'retention')
    .order('created_at', { ascending: false })
    .limit(200);

  if (!error && data && data.length > 0) {
    const latest = new Map<string, StudentRiskSnapshot & { students?: RetentionSignal['students'] }>();
    for (const row of data as (StudentRiskSnapshot & { students?: RetentionSignal['students'] })[]) {
      if (!latest.has(row.student_id)) latest.set(row.student_id, row);
    }
    return {
      signals: [...latest.values()].map((r) => ({
        id: r.id,
        academy_id: r.academy_id,
        student_id: r.student_id,
        risk_level: r.risk_level as RetentionRiskLevel,
        score: r.score,
        reason: r.reason,
        signals: r.signals,
        created_at: r.created_at,
        students: r.students,
      })) as RetentionSignal[],
      source: 'snapshots' as const,
    };
  }

  const legacy = await supabase
    .from('retention_signals')
    .select('*, students(id, name, grade)')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (legacy.data ?? []) as RetentionSignal[];
  const latest = new Map<string, RetentionSignal>();
  for (const row of rows) {
    if (!latest.has(row.student_id)) latest.set(row.student_id, row);
  }
  return { signals: [...latest.values()], source: 'legacy' as const };
}

export async function fetchReregistrationRecords(academyId: string) {
  const { data, error } = await supabase
    .from('reregistration_records')
    .select('*, students(id, name, grade)')
    .eq('academy_id', academyId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) return { records: [] as ReregistrationRecord[], error: error.message };
  return { records: (data ?? []) as ReregistrationRecord[], error: null };
}

export async function fetchStudentRiskSnapshots(studentId: string) {
  const { data } = await supabase
    .from('student_risk_snapshots')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (data && data.length > 0) return data as StudentRiskSnapshot[];

  const { data: legacy } = await supabase
    .from('student_risk_signals')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(3);

  return ((legacy ?? []) as StudentRiskSnapshot[]).map((r) => ({
    ...r,
    snapshot_type: 'learning' as const,
    score: 0,
  }));
}

export async function fetchStudentReregistration(studentId: string) {
  const { data } = await supabase
    .from('reregistration_records')
    .select('*')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ReregistrationRecord | null) ?? null;
}
