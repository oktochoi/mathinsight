'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useConsultationCard } from '@/hooks/useConsultationCard';
import { ConsultationCardView } from '@/components/documents/ConsultationCardView';
import { DocumentPageHeader } from '@/components/documents/DocumentPageHeader';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';

export default function ConsultationCardDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { card, loading, error, refetch } = useConsultationCard(id);

  if (loading) return <PageLoader />;

  const studentId = card?.student_id;
  const studentName = (card?.students as { name?: string })?.name;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <DocumentPageHeader
        backHref={
          studentId ? `/consultation-cards?student=${studentId}` : '/consultation-cards'
        }
        backLabel="상담 카드"
        title={studentName ? `${studentName} · 상담 카드` : '상담 카드'}
        subtitle={
          card
            ? `${card.period_start} ~ ${card.period_end} · 저장 ${card.created_at.slice(0, 10)}`
            : undefined
        }
        actions={
          studentId ? (
            <Link
              href={`/students/${studentId}`}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              학생 상세
            </Link>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}
      {!error && !card && !loading && (
        <EmptyState title="상담 카드를 찾을 수 없습니다" />
      )}
      {card && <ConsultationCardView card={card} />}
    </div>
  );
}
