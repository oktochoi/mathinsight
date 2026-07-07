import Image from 'next/image';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { SITE_LOGO } from '@/lib/marketing/siteAssets';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

export const BRAND_LOGO_SIZE_DEFAULT = 56;

type BrandLogoImageProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogoImage({
  size = BRAND_LOGO_SIZE_DEFAULT,
  className,
  priority = false,
}: BrandLogoImageProps) {
  return (
    <Image
      src={SITE_LOGO}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      priority={priority}
      aria-hidden
    />
  );
}

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  imageClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  size?: number;
  variant?: 'default' | 'light';
  priority?: boolean;
};

export function BrandLogo({
  href = '/',
  className,
  imageClassName,
  nameClassName,
  showName = true,
  size = BRAND_LOGO_SIZE_DEFAULT,
  variant = 'default',
  priority = false,
}: BrandLogoProps) {
  const content = (
    <>
      <BrandLogoImage size={size} className={imageClassName} priority={priority} />
      {showName && (
        <span
          className={cn(
            mkt.logoText,
            variant === 'light' && 'text-white',
            nameClassName
          )}
        >
          {BRAND_NAME}
        </span>
      )}
    </>
  );

  const wrapClass = cn(mkt.logo, className);

  if (href) {
    return (
      <Link href={href} className={wrapClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
