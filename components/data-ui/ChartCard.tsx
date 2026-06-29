'use client';

import { cn } from '@/lib/cn';
import { StatusBadge } from '@/components/data-ui/StatusBadge';

export function ChartCard({
  title,
  description,
  value,
  unit,
  delta,
  deltaLabel = '전주 대비',
  period,
  onPeriodChange,
  children,
  empty,
  className,
  badge,
}: {
  title: string;
  description?: string;
  value?: string | number;
  unit?: string;
  delta?: number | null;
  deltaLabel?: string;
  period?: string;
  onPeriodChange?: (p: string) => void;
  children: React.ReactNode;
  empty?: boolean;
  className?: string;
  badge?: { label: string; tone?: 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'neutral' };
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white shadow-sm min-w-0 flex flex-col',
        className
      )}
    >
      <div className="px-5 pt-5 pb-3 border-b border-slate-100/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              {badge && <StatusBadge label={badge.label} tone={badge.tone ?? 'neutral'} size="sm" />}
            </div>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          {onPeriodChange && period && (
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 shrink-0"
            >
              <option value="7d">7일</option>
              <option value="5w">5주</option>
            </select>
          )}
        </div>
        {value != null && !empty && (
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {value}
              {unit && <span className="text-sm font-semibold text-slate-500 ml-0.5">{unit}</span>}
            </span>
            {delta != null && delta !== 0 && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  delta > 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {delta > 0 ? '+' : ''}
                {delta}
                {unit === '%' || !unit ? '%' : ''} {deltaLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="px-3 pb-4 pt-2 flex-1 min-w-0">
        {empty ? (
          <div className="h-[160px] flex items-center justify-center text-sm text-slate-400 px-4 text-center">
            운영 기록이 쌓이면 추이가 표시됩니다.
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
