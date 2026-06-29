import type { ConsultationCard, CounselingSession } from '@/types/database';
import type { CounselingTarget } from '@/hooks/useCounselingTargets';

const RECENT_SESSION_DAYS = 14;

export function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/** 최근 N일 내 상담 완료·후속 필요 세션이 있는 학생 */
export function recentCounselingStudentIds(
  sessions: CounselingSession[],
  days = RECENT_SESSION_DAYS
) {
  const cutoff = daysAgoIso(days);
  const ids = new Set<string>();
  for (const s of sessions) {
    if (s.status !== 'completed' && s.status !== 'followup_needed') continue;
    const at = s.completed_at ?? s.updated_at;
    if (at && at >= cutoff) ids.add(s.student_id);
  }
  return ids;
}

export function activeSessionStudentIds(sessions: CounselingSession[]) {
  const ids = new Set<string>();
  for (const s of sessions) {
    if (s.status === 'scheduled' || s.status === 'in_progress') {
      ids.add(s.student_id);
    }
  }
  return ids;
}

/** prep에 노출할 위험 학생 — 최근 상담 완료·진행 중이면 제외 */
export function filterPrepTargets(
  targets: CounselingTarget[],
  sessions: CounselingSession[]
) {
  const recent = recentCounselingStudentIds(sessions);
  const active = activeSessionStudentIds(sessions);
  return targets.filter((t) => !recent.has(t.studentId) && !active.has(t.studentId));
}

/** prep에 노출할 대기 카드 — 연결된 세션이 이미 완료면 제외 */
export function filterActionablePendingCards(
  cards: ConsultationCard[],
  sessions: CounselingSession[]
) {
  const completedSessionByCard = new Map<string, CounselingSession>();
  for (const s of sessions) {
    if (!s.consultation_card_id) continue;
    if (s.status === 'completed' || s.status === 'followup_needed') {
      completedSessionByCard.set(s.consultation_card_id, s);
    }
  }

  const recentByStudent = recentCounselingStudentIds(sessions);

  return cards.filter((c) => {
    if ((c.consultation_status ?? 'pending') !== 'pending') return false;
    if (completedSessionByCard.has(c.id)) return false;
    if (recentByStudent.has(c.student_id)) {
      const cardDate = c.created_at;
      const studentSessions = sessions.filter((s) => s.student_id === c.student_id);
      const lastComplete = studentSessions
        .filter((s) => s.status === 'completed' || s.status === 'followup_needed')
        .map((s) => s.completed_at ?? s.updated_at)
        .sort()
        .pop();
      if (lastComplete && cardDate <= lastComplete) return false;
    }
    return true;
  });
}

export function sessionListFilterForStep(
  step: string,
  sessions: CounselingSession[]
) {
  if (step === 'session') {
    return sessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress');
  }
  if (step === 'wrapup') {
    return sessions.filter(
      (s) => s.status === 'completed' || s.status === 'followup_needed'
    );
  }
  return sessions;
}
