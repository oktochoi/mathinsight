'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

export function DashboardCard({
  children,
  className,
  size = 'md',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'app-card',
        size === 'sm' && 'p-4',
        size === 'md' && 'p-5',
        size === 'lg' && 'p-6',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function WidgetHeader({
  title,
  description,
  href,
  hrefLabel = '전체',
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--app-ink)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {description}
          </p>
        )}
      </div>
      {action ??
        (href ? (
          <Link
            href={href}
            className="text-xs font-medium shrink-0 transition-colors hover:opacity-70"
            style={{ color: 'var(--app-accent)' }}
          >
            {hrefLabel} →
          </Link>
        ) : null)}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'violet';
}) {
  const styles: Record<string, string> = {
    success: 'app-badge-green',
    danger:  'app-badge-red',
    warning: 'app-badge-amber',
    info:    'app-badge-blue',
    violet:  'bg-violet-50 text-violet-700',
    neutral: 'app-badge-slate',
  };
  return (
    <span className={cn('app-badge text-[10px]', styles[tone])}>
      {label}
    </span>
  );
}

export function StudentAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = name.trim().charAt(0) || '?';
  const palettes = [
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#ffedd5', text: '#c2410c' },
  ];
  const p = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold shrink-0',
        size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
      )}
      style={{ background: p.bg, color: p.text }}
    >
      {initial}
    </span>
  );
}

export function WidgetEmpty({ message }: { message: string }) {
  return (
    <div className="app-empty py-10">
      <div className="app-empty-icon">
        <i className="ri-inbox-line" />
      </div>
      <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{message}</p>
    </div>
  );
}

export function WidgetRow({
  href,
  avatar,
  title,
  subtitle,
  badge,
  badgeTone = 'neutral',
  trailing,
}: {
  href: string;
  avatar?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'violet';
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg transition-colors group"
      style={{ color: 'inherit' }}
    >
      {avatar && <StudentAvatar name={avatar} size="sm" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--app-ink)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {badge && <StatusBadge label={badge} tone={badgeTone} />}
      {trailing}
      <i className="ri-arrow-right-s-line text-sm shrink-0" style={{ color: 'var(--app-ink-4)' }} />
    </Link>
  );
}

export function DeltaBadge({
  delta,
  label = '전일 대비',
}: {
  delta: number;
  label?: string;
}) {
  if (delta === 0) {
    return <span className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{label} —</span>;
  }
  const up = delta > 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold"
      style={{ color: up ? 'var(--app-success)' : 'var(--app-danger)' }}
    >
      <i className={cn('text-sm', up ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line')} />
      {Math.abs(delta)}
      <span className="font-normal ml-0.5" style={{ color: 'var(--app-ink-3)' }}>{label}</span>
    </span>
  );
}

export function KpiCard({
  label,
  value,
  href,
  icon,
  delta,
  deltaLabel,
  accent = 'blue',
  unit,
  sparkline,
}: {
  label: string;
  value: number | string;
  href?: string;
  icon: string;
  delta?: number;
  deltaLabel?: string;
  accent?: 'blue' | 'green' | 'orange' | 'red' | 'violet';
  sparkline?: React.ReactNode;
  unit?: string;
}) {
  const accentMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: '#eff6ff', text: '#2563eb' },
    green:  { bg: '#f0fdf4', text: '#059669' },
    orange: { bg: '#fff7ed', text: '#ea580c' },
    red:    { bg: '#fef2f2', text: '#dc2626' },
    violet: { bg: '#f5f3ff', text: '#7c3aed' },
  };
  const a = accentMap[accent];

  const inner = (
    <div
      className={cn(
        'app-card p-4 h-full transition-all duration-150',
        href && 'cursor-pointer hover:shadow-[var(--s-md)] hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: a.bg }}
        >
          <i className={cn(icon, 'text-base')} style={{ color: a.text }} />
        </div>
        {sparkline && <div className="w-16 h-7 shrink-0">{sparkline}</div>}
      </div>
      <p className="text-[11px] font-medium mt-3 mb-0.5" style={{ color: 'var(--app-ink-3)' }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums leading-none"
        style={{ color: 'var(--app-ink)', letterSpacing: '-0.04em' }}
      >
        {value}
        {unit && (
          <span className="text-base font-semibold ml-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {unit}
          </span>
        )}
      </p>
      {delta !== undefined && (
        <div className="mt-2">
          <DeltaBadge delta={delta} label={deltaLabel} />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href} className="block h-full">{inner}</Link>;
  return inner;
}

export function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: string; bg: string; text: string }> = {
    lesson:   { icon: 'ri-book-open-line',     bg: '#eff6ff', text: '#2563eb' },
    homework: { icon: 'ri-file-list-3-line',   bg: '#fff7ed', text: '#ea580c' },
    test:     { icon: 'ri-bar-chart-line',     bg: '#f5f3ff', text: '#7c3aed' },
    consult:  { icon: 'ri-chat-smile-3-line',  bg: '#f0fdf4', text: '#059669' },
    report:   { icon: 'ri-mail-send-line',     bg: '#eff6ff', text: '#2563eb' },
    schedule: { icon: 'ri-calendar-line',      bg: '#f1f5f9', text: '#64748b' },
  };
  const item = map[type] ?? map.schedule;
  return (
    <span
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: item.bg }}
    >
      <i className={cn(item.icon, 'text-sm')} style={{ color: item.text }} />
    </span>
  );
}
