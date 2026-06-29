import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <FadeIn className={cn('mb-10 md:mb-14', align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className={cn(mkt.eyebrow, 'mb-3')}>{eyebrow}</p>}
      <h2 className={mkt.h2}>{title}</h2>
      {description && <p className={cn(mkt.lead, 'mt-4')}>{description}</p>}
    </FadeIn>
  );
}
