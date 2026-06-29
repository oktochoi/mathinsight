import Link from 'next/link';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/lib/design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: buttonClasses.primary,
  secondary: buttonClasses.secondary,
  ghost: buttonClasses.ghost,
  danger: buttonClasses.danger,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: buttonClasses.sm,
  md: '',
  lg: buttonClasses.lg,
};

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof ButtonBaseProps | 'href'> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClassName({
  variant = 'primary',
  size = 'md',
  iconOnly,
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'iconOnly' | 'className'>) {
  return cn(
    buttonClasses.base,
    variantClass[variant],
    size !== 'md' && sizeClass[size],
    iconOnly && buttonClasses.icon,
    iconOnly && size === 'sm' && 'app-btn-sm',
    'app-press',
    className
  );
}

export function Button(props: ButtonProps) {
  const { variant, size, iconOnly, className, children, disabled, ...rest } = props;
  const classes = buttonClassName({ variant, size, iconOnly, className });

  if ('href' in props && props.href) {
    const { href, ...linkRest } = rest as Omit<ButtonAsLink, keyof ButtonBaseProps>;
    return (
      <Link
        href={href}
        className={cn(classes, disabled && 'pointer-events-none opacity-50')}
        aria-disabled={disabled || undefined}
        {...linkRest}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      {...(rest as Omit<ButtonAsButton, keyof ButtonBaseProps>)}
    >
      {children}
    </button>
  );
}
