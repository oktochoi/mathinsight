import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Tone = 'neutral' | 'ai' | 'risk';

const tones: Record<Tone, string> = {
  neutral: mkt.badgeNeutral,
  ai: mkt.badgeAi,
  risk: mkt.badgeRisk,
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cn(tones[tone], className)}>{children}</span>;
}
