import { BRAND_NAME, BRAND_TAGLINE_SHORT } from '@/lib/brand';
import { cn } from '@/lib/cn';

type BrandMarkProps = {
  className?: string;
  nameClassName?: string;
  showTagline?: boolean;
  tagline?: string;
  variant?: 'light' | 'dark';
};

export function BrandMark({
  className,
  nameClassName,
  showTagline = false,
  tagline = BRAND_TAGLINE_SHORT,
  variant = 'dark',
}: BrandMarkProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <span
        className={cn(
          'font-bold tracking-tight block truncate',
          variant === 'light' ? 'text-white' : 'text-indigo-950',
          nameClassName
        )}
      >
        {BRAND_NAME}
      </span>
      {showTagline && (
        <span
          className={cn(
            'text-[10px] font-medium tracking-wider block truncate',
            variant === 'light' ? 'text-blue-400/70' : 'text-indigo-500/80'
          )}
        >
          {tagline}
        </span>
      )}
    </div>
  );
}
