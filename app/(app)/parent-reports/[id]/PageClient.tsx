'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useParentReport } from '@/hooks/useParentReport';
import { ParentReportView } from '@/components/documents/ParentReportView';
import { DocumentPageHeader } from '@/components/documents/DocumentPageHeader';
import { PrintDocumentButton } from '@/components/ui/PrintDocumentButton';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';

export default function ParentReportDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { report, loading, error, refetch } = useParentReport(id);

  if (loading) return <PageLoader />;

  const studentId = report?.student_id;
  const studentName = (report?.students as { name?: string })?.name;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <DocumentPageHeader
        backHref={studentId ? `/parent-reports?student=${studentId}` : '/parent-reports'}
        backLabel="학부모 리포트"
        title={studentName ? `${studentName} · 학부모 리포트` : '학부모 리포트'}
        subtitle={
          report
            ? `${report.period_start} ~ ${report.period_end} · 저장 ${report.created_at.slice(0, 10)}`
            : undefined
        }
        actions={
          <>
            {report && <PrintDocumentButton />}
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
      {!error && !report && !loading && (
        <EmptyState title="리포트를 찾을 수 없습니다" />
      )}
      {report && <div className="print-document"><ParentReportView report={report} /></div>}
    </div>
  );
}
