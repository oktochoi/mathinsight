'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useStudentGrowth } from '@/hooks/useStudentGrowth';
import { useRetention, REREGISTRATION_STATUS_LABELS } from '@/hooks/useRetention';
import { StudentGrowthDetail } from '@/components/student-growth/StudentGrowthDetail';
import { RetentionDataTable } from '@/components/retention/RetentionDataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner, EmptyState } from '@/components/ui/DataStates';
import { STAFF_PAGES } from '@/lib/staffPages';

function RetentionPageContent() {
  const { metrics, loading: growthLoading, error: growthError, refetch: refetchGrowth } =
    useStudentGrowth();
  const {
    signals,
    records,
    loading: retentionLoading,
    error: retentionError,
    scanning,
    runScan,
    refetch: refetchRetention,
  } = useRetention();
  const [toast, setToast] = useState('');

  const handleScan = async () => {
    const result = await runScan();
    if (result.error) {
      setToast(result.error);
      return;
    }
    setToast(`${result.scanned}명 스캔 완료. 학습 신호가 갱신되었습니다.`);
    setTimeout(() => setToast(''), 3500);
    void refetchGrowth();
  };

  const sorted = [...signals].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk_level] - order[b.risk_level] || b.score - a.score;
  });

  if (growthLoading || retentionLoading) return <PageLoader />;
  if (growthError) return <ErrorBanner message={growthError} onRetry={refetchGrowth} />;
  if (!metrics) return null;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-4xl mx-auto pb-12">
      <div>
        <Link
          href="/dashboard"
          className="text-xs mb-2 inline-block hover:opacity-70 transition-opacity"
          style={{ color: 'var(--app-ink-3)' }}
        >
          ← Dashboard
        </Link>
        <PageHeader title={STAFF_PAGES.retention.title}>
          <button
            type="button"
            disabled={scanning}
            onClick={() => void handleScan()}
            className="app-btn app-btn-ghost disabled:opacity-50"
          >
            {scanning ? '스캔 중…' : '학습 신호 갱신'}
          </button>
        </PageHeader>
        <p className="text-sm -mt-2" style={{ color: 'var(--app-ink-3)' }}>
          {STAFF_PAGES.retention.description}
        </p>
      </div>

      {retentionError && (
        <ErrorBanner message={retentionError} onRetry={refetchRetention} />
      )}
      {toast && (
        <p className="text-sm rounded-xl px-3 py-2 app-inline-success">
          {toast}
        </p>
      )}

      <StudentGrowthDetail
        metrics={metrics}
        afterReregistration={
          <section id="attention" className="scroll-mt-24 app-card p-6 sm:p-7">
            <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}>
              관리가 필요한 학생
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
              재등록·출결·미납 신호 — 상담·연락이 필요한 학생입니다.
            </p>
            <div className="mt-5">
              <RetentionDataTable signals={sorted} loading={false} />
            </div>
          </section>
        }
        footer={
          <section
            id="records"
            className="scroll-mt-24 rounded-2xl overflow-hidden"
            style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', boxShadow: 'var(--s-sm)' }}
          >
            <div className="p-6 sm:p-7" style={{ borderBottom: '1px solid var(--app-border)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}>
                재등록 진행 기록
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>상담 후 재등록 상태 추적</p>
            </div>
            {records.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="재등록 기록이 없습니다"
                  description="재등록 상담 완료 후 상태가 여기에 쌓입니다."
                />
              </div>
            ) : (
              <ul>
                {records.slice(0, 20).map((r) => (
                  <li
                    key={r.id}
                    className="px-6 py-4 flex flex-wrap items-start gap-3"
                    style={{ borderBottom: '1px solid var(--app-border)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                          {r.students?.name ?? '학생'}
                        </p>
                        <span className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{r.students?.grade}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' }}
                        >
                          {REREGISTRATION_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      {r.memo && <p className="text-sm mt-1" style={{ color: 'var(--app-ink-2)' }}>{r.memo}</p>}
                    </div>
                    <Link
                      href={`/students/${r.student_id}`}
                      className="app-btn app-btn-ghost text-xs shrink-0"
                    >
                      학생 상세
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        }
      />
    </div>
  );
}

export default function RetentionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RetentionPageContent />
    </Suspense>
  );
}
