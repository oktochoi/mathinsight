import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Button } from '@/components/marketing/ui/Button';

type Action = { href: string; label: string; variant?: 'primary' | 'secondary' | 'accent' };

export function CTASection({
  title,
  description,
  primary,
  secondary,
  variant = 'blue',
  className,
}: {
  title: string;
  description?: string;
  primary: Action;
  secondary?: Action;
  variant?: 'blue' | 'green' | 'light';
  className?: string;
}) {
  const isBlue = variant === 'blue';
  const isGreen = variant === 'green';

  return (
    <section className={cn(mkt.sectionSm, className)}>
      <div className={mkt.container}>
        <FadeIn>
          <div
            className={cn(
              'flex flex-col gap-5 rounded-2xl px-8 py-10 md:flex-row md:items-center md:justify-between',
              isBlue && 'bg-gradient-to-br from-blue-700 to-sky-600 text-white shadow-lg shadow-blue-700/20',
              isGreen && 'bg-gradient-to-r from-lime-500 to-green-600 text-white',
              variant === 'light' && 'border border-slate-200 bg-slate-50'
            )}
          >
            <div className="max-w-xl">
              <h2
                className={cn(
                  'text-xl font-extrabold md:text-2xl',
                  variant === 'light' && 'text-slate-900'
                )}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={cn(
                    'mt-2 text-sm leading-relaxed',
                    isBlue || isGreen ? 'text-white/90' : 'text-slate-600'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Button
                href={primary.href}
                variant={isBlue || isGreen ? 'accent' : 'primary'}
                className={isBlue || isGreen ? undefined : undefined}
              >
                {primary.label}
              </Button>
              {secondary && (
                <Button
                  href={secondary.href}
                  variant="secondary"
                  className={
                    isBlue || isGreen
                      ? 'border-white/40 bg-transparent text-white hover:bg-white/10'
                      : undefined
                  }
                >
                  {secondary.label}
                </Button>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
