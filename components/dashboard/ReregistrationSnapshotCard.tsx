'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';

export function ReregistrationSnapshotCard({ stats }: { stats: DashboardStats }) {
  const highRisk = stats.retentionRiskStudents.filter((r) => r.riskLevel === 'high');
  const medRisk = stats.retentionRiskStudents.filter((r) => r.riskLevel === 'medium');
  const total = stats.retentionRiskStudents.length;
  if (total === 0) return null;

  const highNames = highRisk
    .slice(0, 2)
    .map((r) => r.name)
    .join('·');
  const highExtra = highRisk.length > 2 ? ` 외 ${highRisk.length - 2}명` : '';

  return (
    <section
      className="rounded-2xl overflow-hidden h-full"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div className="px-5 py-4 flex items-start justify-between gap-4 h-full">
        <div className="space-y-3 flex-1">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--app-ink-4)' }}
            >
              이번 달 재등록
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
              재등록 검토 학생 <span className="text-base">{total}</span>명
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-0.5 h-2 rounded-full overflow-hidden">
              {highRisk.length > 0 && (
                <div
                  className="bg-red-500 rounded-l-full"
                  style={{ width: `${(highRisk.length / total) * 100}%` }}
                />
              )}
              {medRisk.length > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ width: `${(medRisk.length / total) * 100}%` }}
                />
              )}
              <div className="flex-1 bg-emerald-300 rounded-r-full" />
            </div>
            <span className="text-xs shrink-0" style={{ color: 'var(--app-ink-3)' }}>
              위험 {highRisk.length} / 주의 {medRisk.length} / 안정{' '}
              {total - highRisk.length - medRisk.length}
            </span>
          </div>

          {highRisk.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
              <span className="font-semibold text-red-600">
                {highNames}
                {highExtra}
              </span>{' '}
              — 이번 주 상담 권장
            </p>
          )}
        </div>

        <Link
          href="/retention"
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl"
          style={{
            background: 'var(--app-surface-2)',
            color: 'var(--app-ink-2)',
            border: '1px solid var(--app-border)',
          }}
        >
          전체 보기 →
        </Link>
      </div>
    </section>
  );
}
