'use client';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-base font-semibold" style={{ color: 'var(--app-ink)' }}>
        오류가 발생했습니다
      </p>
      <p className="text-sm max-w-md" style={{ color: 'var(--app-ink-3)' }}>
        {error.message || '잠시 후 다시 시도해 주세요.'}
      </p>
      <button type="button" onClick={reset} className="app-btn app-btn-primary">
        다시 시도
      </button>
    </div>
  );
}
