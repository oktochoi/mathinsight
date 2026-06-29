import { cn } from '@/lib/cn';
import { typographyClasses } from '@/lib/design/tokens';

type TypographyProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  id?: string;
};

export function PageTitle({ children, className, as: Tag = 'h1' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.pageTitle, className)}>{children}</Tag>;
}

export function SectionTitle({ children, className, as: Tag = 'h2' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.sectionTitle, className)}>{children}</Tag>;
}

export function CardTitle({ children, className, as: Tag = 'h3', id }: TypographyProps) {
  return (
    <Tag id={id} className={cn(typographyClasses.cardTitle, className)}>
      {children}
    </Tag>
  );
}

export function PrimaryMetric({ children, className, as: Tag = 'p' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.metric, 'tabular-nums', className)}>{children}</Tag>;
}

export function BodyText({ children, className, as: Tag = 'p' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.body, className)}>{children}</Tag>;
}

export function Caption({ children, className, as: Tag = 'p' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.caption, className)}>{children}</Tag>;
}

export function MutedText({ children, className, as: Tag = 'p' }: TypographyProps) {
  return <Tag className={cn(typographyClasses.muted, className)}>{children}</Tag>;
}

export function KpiValue({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <p className={cn(size === 'lg' ? typographyClasses.kpiLg : typographyClasses.kpi, className)}>
      {children}
    </p>
  );
}
