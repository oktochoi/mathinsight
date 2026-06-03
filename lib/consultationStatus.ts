import type { ConsultationCard, ConsultationStatus } from '@/types/database';

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending: '상담 대기',
  completed: '상담 완료',
};

export const CONSULTATION_STATUS_STYLES: Record<ConsultationStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function getLatestConsultationCard(
  cards: ConsultationCard[],
  options?: { completedOnly?: boolean }
): ConsultationCard | undefined {
  const sorted = [...cards].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  if (options?.completedOnly) {
    return sorted.find((c) => (c.consultation_status ?? 'pending') === 'completed');
  }
  return sorted[0];
}

export function countPendingConsultations(cards: ConsultationCard[]): number {
  return cards.filter((c) => c.consultation_status !== 'completed').length;
}

export function formatConsultationStatusLine(card: ConsultationCard): string {
  if (card.consultation_status === 'completed' && card.consulted_at) {
    const d = card.consulted_at.slice(0, 10);
    return `상담 완료 (${d})${card.consultation_note ? ` · ${card.consultation_note}` : ''}`;
  }
  return '상담 대기 — 아직 완료 처리 전';
}
