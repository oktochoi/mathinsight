'use client';

import Link from 'next/link';

export function BillingTimelinePlaceholder() {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          수납 추이
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
          이번 달 청구·수납·미수금 흐름
        </p>
      </div>
      <div
        className="rounded-2xl px-4 py-8 text-center space-y-3"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
        }}
      >
        <i className="ri-bar-chart-grouped-line text-2xl" style={{ color: 'var(--app-ink-4)' }} aria-hidden />
        <p className="text-sm font-medium" style={{ color: 'var(--app-ink-2)' }}>
          수납 추이 차트는 준비 중입니다
        </p>
        <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--app-ink-4)' }}>
          청구·입금 내역이 쌓이면 월별 수납 추이가 여기 표시됩니다. 지금은 수납 운영 센터에서 상세를 확인하세요.
        </p>
        <Link href="/billing" className="inline-block text-xs font-semibold" style={{ color: 'var(--app-accent)' }}>
          수납 현황 보기 →
        </Link>
      </div>
    </section>
  );
}
