import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Badge } from '@/components/marketing/ui/Badge';

export function FeatureSection({
  id,
  title,
  description,
  badge,
  badgeTone = 'ai',
  children,
  className,
}: {
  id?: string;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: 'neutral' | 'ai' | 'risk';
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <FadeIn id={id} className={cn('grid gap-8 scroll-mt-24 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-14', className)}>
      <div>
        {badge && (
          <Badge tone={badgeTone} className="mb-4">
            {badge}
          </Badge>
        )}
        <h3 className={mkt.h3}>{title}</h3>
        <p className={cn(mkt.body, 'mt-3')}>{description}</p>
      </div>
      {children}
    </FadeIn>
  );
}

export function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={cn(mkt.card, 'p-6 md:p-7')}>
      <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
      <p className={cn(mkt.body, 'mt-2')}>{desc}</p>
    </div>
  );
}
