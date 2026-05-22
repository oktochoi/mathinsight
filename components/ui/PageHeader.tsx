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
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 shrink-0 min-w-0 max-w-full">{children}</div>
      )}
    </div>
  );
}
