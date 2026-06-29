import Link from 'next/link';
import { cn } from '@/lib/cn';

const ACCENT = {
  blue: 'border-l-blue-500 bg-gradient-to-br from-blue-50/80 to-white',
  green: 'border-l-emerald-500 bg-gradient-to-br from-emerald-50/80 to-white',
  orange: 'border-l-orange-500 bg-gradient-to-br from-orange-50/80 to-white',
  red: 'border-l-red-500 bg-gradient-to-br from-red-50/80 to-white',
  indigo: 'border-l-indigo-500 bg-gradient-to-br from-indigo-50/80 to-white',
  slate: 'border-l-slate-400 bg-gradient-to-br from-slate-50/80 to-white',
} as const;

export function KpiMetric({
  label,
  value,
  unit,
  delta,
  deltaLabel = '전주 대비',
  icon,
  accent = 'slate',
  href,
  size = 'md',
}: {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number | null;
  deltaLabel?: string;
  icon?: string;
  accent?: keyof typeof ACCENT;
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const inner = (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 border-l-[3px] shadow-sm transition-shadow hover:shadow-md',
        ACCENT[accent],
        size === 'sm' && 'p-3',
        size === 'md' && 'p-4',
        size === 'lg' && 'p-5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && <i className={cn(icon, 'text-lg text-slate-300')} />}
      </div>
      <p
        className={cn(
          'font-bold text-slate-900 tabular-nums mt-1',
          size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'
        )}
      >
        {value}
        {unit && <span className="text-sm font-semibold text-slate-500 ml-0.5">{unit}</span>}
      </p>
      {delta != null && delta !== 0 && (
        <p
          className={cn(
            'text-xs font-medium mt-1.5 flex items-center gap-1',
            delta > 0 ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          <i className={delta > 0 ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
          {delta > 0 ? '+' : ''}
          {delta}
          {unit ? unit : '%'} {deltaLabel}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block min-w-0">
        {inner}
      </Link>
    );
  }
  return inner;
}
