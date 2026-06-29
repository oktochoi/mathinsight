import Link from 'next/link';
import { cn } from '@/lib/cn';
import { cardClasses } from '@/lib/design/tokens';
import { CardTitle, Caption, KpiValue, MutedText } from './Typography';

export type AppCardVariant =
  | 'default'
  | 'kpi'
  | 'action'
  | 'insight'
  | 'timeline'
  | 'list'
  | 'chart'
  | 'empty';

type AppCardProps = {
  children: React.ReactNode;
  variant?: AppCardVariant;
  hover?: boolean;
  elevated?: boolean;
  flat?: boolean;
  padding?: 'none' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  onClick?: () => void;
};

const variantSurface: Record<AppCardVariant, string> = {
  default: cardClasses.base,
  kpi: cn(cardClasses.base, 'app-card-hover'),
  action: cn(cardClasses.base, 'app-card-hover cursor-pointer'),
  insight: cn(cardClasses.flat, 'border-indigo-100'),
  timeline: cardClasses.flat,
  list: cardClasses.base,
  chart: cardClasses.base,
  empty: cn(cardClasses.flat, 'border-dashed'),
};

export function AppCard({
  children,
  variant = 'default',
  hover,
  elevated,
  flat,
  padding = 'md',
  className,
  style,
  href,
  onClick,
}: AppCardProps) {
  const surface = flat
    ? cardClasses.flat
    : elevated
      ? cardClasses.elevated
      : variantSurface[variant];

  const paddingClass =
    padding === 'none'
      ? ''
      : padding === 'lg'
        ? 'p-6'
        : variant === 'kpi'
          ? 'p-4'
          : 'p-5';

  const classes = cn(surface, hover && cardClasses.hover, paddingClass, className);

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'text-left w-full')} style={style}>
        {children}
      </button>
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('app-card-header', className)}>
      <div className="min-w-0">
        <CardTitle>{title}</CardTitle>
        {description && <Caption className="mt-0.5">{description}</Caption>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  children,
  flush,
  className,
}: {
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return <div className={cn(flush ? 'app-card-body-flush' : 'app-card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('app-card-footer', className)}>{children}</div>;
}

/** KPI Card — 숫자 중심 운영 지표 */
export function KpiCard({
  label,
  value,
  unit,
  sub,
  href,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  href?: string;
  className?: string;
}) {
  return (
    <AppCard variant="kpi" href={href} className={className}>
      <p className="app-label">{label}</p>
      <KpiValue className="mt-2">
        {value}
        {unit && (
          <span className="text-sm font-semibold ml-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {unit}
          </span>
        )}
      </KpiValue>
      {sub && <MutedText className="mt-1.5">{sub}</MutedText>}
    </AppCard>
  );
}

/** Action Card — 다음 행동 유도 */
export function ActionCard({
  title,
  description,
  action,
  href,
  onClick,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <AppCard variant="action" href={href} onClick={onClick} className={className}>
      <CardTitle>{title}</CardTitle>
      {description && <MutedText className="mt-1">{description}</MutedText>}
      {action && <div className="mt-4">{action}</div>}
    </AppCard>
  );
}

/** Insight Card — AI·상담 인사이트 */
export function InsightCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppCard variant="insight" className={className}>
      <CardTitle className="text-indigo-900">{title}</CardTitle>
      <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
        {children}
      </div>
    </AppCard>
  );
}

/** List Card — 리스트 컨테이너 */
export function ListCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppCard variant="list" padding="none" className={className}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody flush>{children}</CardBody>
    </AppCard>
  );
}

/** Chart Card — 차트 또는 Placeholder 컨테이너 */
export function ChartCardShell({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppCard variant="chart" padding="none" className={className}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody>{children}</CardBody>
    </AppCard>
  );
}

/** Empty Card — 빈 상태 전용 */
export function EmptyCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppCard variant="empty" className={cn('text-center', className)}>
      {children}
    </AppCard>
  );
}
