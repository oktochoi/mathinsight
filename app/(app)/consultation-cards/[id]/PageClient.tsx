'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useConsultationCard } from '@/hooks/useConsultationCard';
import { ConsultationCardView } from '@/components/documents/ConsultationCardView';
import { MarkConsultationComplete } from '@/components/consultation/MarkConsultationComplete';
import { DocumentPageHeader } from '@/components/documents/DocumentPageHeader';
import { PrintDocumentButton } from '@/components/ui/PrintDocumentButton';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';

export default function ConsultationCardDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { card, loading, error, refetch, markConsultationComplete } = useConsultationCard(id);

  if (loading) return <PageLoader />;

  const studentId = card?.student_id;
  const studentName = (card?.students as { name?: string })?.name;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <DocumentPageHeader
        backHref={studentId ? `/counseling?step=prep&student=${studentId}` : '/counseling?step=prep'}
        backLabel="상담 준비"
        title={studentName ? `${studentName} · 상담 카드` : '상담 카드'}
        subtitle={
          card
            ? `${card.period_start} ~ ${card.period_end} · 저장 ${card.created_at.slice(0, 10)}`
            : undefined
        }
        actions={
          <>
            {card && <PrintDocumentButton label="상담 카드 인쇄" />}
            {studentId ? (
              <Link
                href={`/students/${studentId}`}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
              >
                학생 상세
              </Link>
            ) : undefined}
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}
      {!error && !card && !loading && (
        <EmptyState title="상담 카드를 찾을 수 없습니다" />
      )}
      {card && (
        <div className="space-y-4">
          <MarkConsultationComplete
            card={card}
            onComplete={(note) => markConsultationComplete(note)}
          />
          <div className="print-document">
            <ConsultationCardView card={card} />
          </div>
        </div>
      )}
    </div>
  );
}
