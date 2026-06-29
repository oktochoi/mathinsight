import { cn } from '@/lib/cn';

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1
          className="text-xl font-bold truncate"
          style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 shrink-0 min-w-0 max-w-full">{children}</div>
      )}
    </div>
  );
}
