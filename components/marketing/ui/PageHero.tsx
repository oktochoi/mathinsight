import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { HERO_BG, mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Button } from '@/components/marketing/ui/Button';

type Action = { href: string; label: string; variant?: 'primary' | 'secondary' | 'accent' };
type HeroTone = keyof typeof HERO_BG | 'white';

export function PageHero({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  children,
  align = 'left',
  size = 'default',
  tone = 'mint',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  primary?: Action;
  secondary?: Action;
  children?: ReactNode;
  align?: 'left' | 'center';
  size?: 'default' | 'compact';
  tone?: HeroTone;
  className?: string;
}) {
  const centered = align === 'center';
  const bg = tone === 'white' ? 'bg-white' : HERO_BG[tone];

  return (
    <section
      className={cn(
        'border-b border-slate-200',
        bg,
        size === 'compact' ? 'py-12 md:py-14' : 'py-14 md:py-20',
        className
      )}
    >
      <div className={mkt.container}>
        <div
          className={cn(
            'grid gap-10 lg:items-center',
            children ? 'lg:grid-cols-2' : centered && 'mx-auto max-w-3xl text-center',
            !children && !centered && 'max-w-3xl'
          )}
        >
          <FadeIn>
            {eyebrow && <p className={cn(mkt.eyebrow, 'mb-3')}>{eyebrow}</p>}
            <h1 className={size === 'compact' ? 'mkt-display text-[clamp(1.5rem,3vw,1.875rem)] text-slate-900' : mkt.h1}>
              {title}
            </h1>
            {description && (
              <p className={cn(mkt.lead, 'mt-4 max-w-xl', centered && 'mx-auto')}>{description}</p>
            )}
            {(primary || secondary) && (
              <div className={cn('mt-6 flex flex-wrap gap-2.5', centered && 'justify-center')}>
                {primary && (
                  <Button href={primary.href} variant={primary.variant ?? 'primary'}>
                    {primary.label}
                  </Button>
                )}
                {secondary && (
                  <Button href={secondary.href} variant={secondary.variant ?? 'secondary'}>
                    {secondary.label}
                  </Button>
                )}
              </div>
            )}
          </FadeIn>
          {children && <FadeIn delay={0.1}>{children}</FadeIn>}
        </div>
      </div>
    </section>
  );
}

export function PageHeroMinimal(props: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  primary?: Action;
  secondary?: Action;
}) {
  return <PageHero {...props} size="compact" tone="mint" />;
}

export function ExploreLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className={cn(mkt.card, mkt.cardHover, 'group block p-6')}>
      <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-teal-700">자세히 →</span>
    </Link>
  );
}
