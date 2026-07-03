import { BRAND_NAME, BRAND_TAGLINE_SHORT } from '@/lib/brand';
import { cn } from '@/lib/cn';
import { BrandLogoImage } from '@/components/brand/BrandLogo';

type BrandMarkProps = {
  className?: string;
  nameClassName?: string;
  showTagline?: boolean;
  tagline?: string;
  variant?: 'light' | 'dark';
  showLogo?: boolean;
  logoSize?: number;
};

export function BrandMark({
  className,
  nameClassName,
  showTagline = false,
  tagline = BRAND_TAGLINE_SHORT,
  variant = 'dark',
  showLogo = true,
  logoSize = 28,
}: BrandMarkProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      {showLogo && <BrandLogoImage size={logoSize} />}
      <div className="min-w-0">
        <span
          className={cn(
            'block truncate font-bold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-indigo-950',
            nameClassName
          )}
        >
          {BRAND_NAME}
        </span>
        {showTagline && (
          <span
            className={cn(
              'block truncate text-[10px] font-medium tracking-wider',
              variant === 'light' ? 'text-blue-400/70' : 'text-indigo-500/80'
            )}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
