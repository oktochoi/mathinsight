import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        warning: 'bg-orange-50 text-orange-800 border-orange-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        ai: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        neutral: 'bg-slate-50 text-slate-600 border-slate-200',
        violet: 'bg-violet-50 text-violet-800 border-violet-200',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-[11px] px-2.5 py-0.5',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
    },
  }
);

export type StatusBadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export function StatusBadge({
  label,
  tone,
  size,
  dot,
  className,
}: {
  label: string;
  tone?: StatusBadgeTone;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            tone === 'danger' && 'bg-red-500',
            tone === 'warning' && 'bg-orange-500',
            tone === 'success' && 'bg-emerald-500',
            tone === 'ai' && 'bg-indigo-500',
            tone === 'info' && 'bg-blue-500',
            (!tone || tone === 'neutral' || tone === 'violet') && 'bg-slate-400'
          )}
        />
      )}
      {label}
    </span>
  );
}
