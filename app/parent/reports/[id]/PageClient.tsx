'use client';

import { useParams } from 'next/navigation';
import { useParentReport } from '@/hooks/useParentReport';
import { ParentReportView } from '@/components/documents/ParentReportView';
import { DocumentPageHeader } from '@/components/documents/DocumentPageHeader';
import { PageLoader, EmptyState, ErrorBanner } from '@/components/ui/DataStates';

export default function ParentReportPortalDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { report, loading, error, refetch } = useParentReport(id);

  if (loading) return <PageLoader />;

  const studentName = (report?.students as { name?: string })?.name;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <DocumentPageHeader
        backHref="/parent"
        backLabel="돌아가기"
        title={studentName ? `${studentName} 학부모 안내문` : '학부모 안내문'}
        subtitle={
          report
            ? `${report.period_start} ~ ${report.period_end}`
            : undefined
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}
      {!error && !report && !loading && (
        <EmptyState title="리포트를 찾을 수 없습니다" />
      )}
      {report && <ParentReportView report={report} />}
    </div>
  );
}
