import Link from 'next/link';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost';

const variants: Record<Variant, string> = {
  primary: mkt.btnPrimary,
  secondary: mkt.btnSecondary,
  accent: mkt.btnAccent,
  ghost: mkt.btnGhost,
};

type Props = {
  href?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
};

export function Button({
  href,
  variant = 'primary',
  className,
  children,
  onClick,
  type = 'button',
  disabled,
}: Props) {
  const cls = cn(variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
