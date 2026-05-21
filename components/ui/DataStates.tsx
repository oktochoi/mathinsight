'use client';

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-slate-100 rounded w-full max-w-[120px]"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 bg-white border border-slate-200 animate-pulse">
          <div className="h-10 w-10 bg-slate-100 rounded-xl mb-3"></div>
          <div className="h-3 w-20 bg-slate-100 rounded mb-2"></div>
          <div className="h-8 w-16 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = 'ri-inbox-line',
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-slate-100">
        <i className={`${icon} text-slate-400 text-2xl`}></i>
      </div>
      <p className="text-sm text-slate-600 font-medium">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 bg-red-50 border border-red-200 text-red-800 text-sm">
      <span className="flex items-center gap-2">
        <i className="ri-error-warning-line"></i>
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 cursor-pointer"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">데이터를 불러오는 중...</p>
      </div>
    </div>
  );
}
