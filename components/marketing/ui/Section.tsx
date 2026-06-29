import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export function Section({
  children,
  className,
  muted,
  id,
  size = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <section
      id={id}
      className={cn(size === 'sm' ? mkt.sectionSm : mkt.section, muted && mkt.sectionMuted, className)}
    >
      {children}
    </section>
  );
}

export function SectionInner({
  children,
  className,
  narrow,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={cn(wide ? mkt.containerWide : narrow ? mkt.containerNarrow : mkt.container, className)}>
      {children}
    </div>
  );
}
