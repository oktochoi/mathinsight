'use client';

import { useEffect } from 'react';
import { ErrorPageShell } from '@/components/site/ErrorPageShell';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative">
      <ErrorPageShell
        statusCode={500}
        title="일시적인 오류가 발생했습니다"
        description="서비스 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      />
      <div className="absolute inset-x-0 bottom-16 flex justify-center">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-200 hover:text-sky-700"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
