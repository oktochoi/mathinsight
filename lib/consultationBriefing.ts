import type { ConsultationCard, ConsultationFollowup, LessonLog, Student } from '@/types/database';
import { assessStudentRisk } from '@/lib/studentRisk';
import { getLatestConsultationCard } from '@/lib/consultationStatus';
import { getRecentUnits } from '@/lib/analytics';

/** 상담 준비 30초 브리핑 (규칙 기반, 기록만 근거) */
export function buildConsultationBriefing(
  student: Pick<Student, 'name' | 'grade'>,
  logs: LessonLog[],
  cards: ConsultationCard[] = [],
  followups: ConsultationFollowup[] = []
): { headline: string; lines: string[]; kindLabel: string } {
  const lastCard = getLatestConsultationCard(cards, { completedOnly: true });
  const risk = assessStudentRisk(logs, { followups, lastCard });
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const cutoff = fourWeeksAgo.toISOString().slice(0, 10);
  const recent = logs.filter((l) => l.lesson_date >= cutoff);
  const units = getRecentUnits(recent, 3);

  const headline = `${student.name} 학생 · ${risk.kindLabel}`;

  const lines = [...risk.briefingLines];
  if (units.length > 0 && !lines.some((l) => l.startsWith('최근 단원'))) {
    lines.unshift(`최근 단원: ${units.join(' → ')}`);
  }
  if (lastCard) {
    lines.push(
      `마지막 상담 완료: ${lastCard.period_start} ~ ${lastCard.period_end}${
        lastCard.consulted_at ? ` (${lastCard.consulted_at.slice(0, 10)})` : ''
      }`
    );
  }
  const pendingCard = cards.find((c) => (c.consultation_status ?? 'pending') === 'pending');
  if (pendingCard) {
    lines.push('상담 카드가 저장됐지만 아직 「상담 완료」 처리 전입니다.');
  }
  const pending = followups.filter((f) => f.status === 'pending');
  if (pending.length > 0 && !lines.some((l) => l.includes('상담 후 확인'))) {
    lines.push(`상담 후 확인 예정: ${pending.map((f) => f.title).join(', ')}`);
  }

  return {
    headline,
    lines: lines.slice(0, 6),
    kindLabel: risk.kindLabel,
  };
}
