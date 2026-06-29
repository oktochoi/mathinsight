'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatWon, type PaymentTimelinePoint } from '@/lib/billingOperations';

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid var(--app-border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  fontSize: 12,
};

function formatShort(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString('ko-KR');
}

export function BillingTimeline({ data }: { data: PaymentTimelinePoint[] }) {
  return (
    <section className="rounded-2xl p-6 shadow-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <div className="mb-5">
        <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>Payment Timeline</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>이번 달 청구·수납·미수금 추이</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--app-ink-4)' }} tickFormatter={formatShort} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => formatWon(Number(v ?? 0))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="billed"
              name="청구 금액"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="collected"
              name="실제 수납"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="outstanding"
              name="미수금"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
