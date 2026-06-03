import type { LessonLog, Student, AttentionStudent } from '@/types/database';
import {
  assessStudentRisk,
  riskNeedsStaffAction,
  type RiskDisplayKind,
} from '@/lib/studentRisk';

export function buildAttentionReason(logs: LessonLog[]): string {
  const risk = assessStudentRisk(logs);
  if (risk.kind === 'stable') return risk.signals[0]?.label ?? '최근 기록 양호';
  if (risk.signals.length === 0) return risk.kindLabel;
  return `${risk.kindLabel} · ${risk.signals.slice(0, 2).map((s) => s.label).join(' · ')}`;
}

/** 대시보드·시간표 — 상담·보강 등 실제 조치가 필요한 학생만 */
export function getAttentionStudents(
  students: (Student & { classes?: { name: string } | null })[],
  logsByStudent: Map<string, LessonLog[]>
): AttentionStudent[] {
  const result: AttentionStudent[] = [];

  for (const student of students) {
    const logs = logsByStudent.get(student.id) ?? [];
    const risk = assessStudentRisk(logs);
    if (!riskNeedsStaffAction(risk.kind)) continue;

    result.push({
      id: student.id,
      name: student.name,
      grade: student.grade,
      className: student.classes?.name ?? '-',
      status: risk.status,
      reason: buildAttentionReason(logs),
      urgency: risk.kind === 'consultation' ? 'high' : 'medium',
      riskKindLabel: risk.kindLabel,
      riskKind: risk.kind,
    });
  }

  const kindOrder: Record<RiskDisplayKind, number> = {
    consultation: 0,
    makeup: 1,
    attention: 2,
    recovering: 3,
    stable: 4,
  };

  return result.sort(
    (a, b) =>
      (kindOrder[a.riskKind ?? 'makeup'] ?? 9) - (kindOrder[b.riskKind ?? 'makeup'] ?? 9)
  );
}
