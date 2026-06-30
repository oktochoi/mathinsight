'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DevTools() {
  if (process.env.NODE_ENV === 'production') return null;

  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, url: string, body?: object) => {
    setBusy(key);
    try {
      await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 space-y-2">
      <p className="text-xs font-bold text-amber-800">개발용 도구</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void run('expire', '/api/subscription/dev-expire')}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 cursor-pointer"
        >
          {busy === 'expire' ? '…' : '체험 즉시 만료'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => void run('activate', '/api/subscription/activate', { plan: 'starter' })}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-900 cursor-pointer"
        >
          {busy === 'activate' ? '…' : '스타터 active 처리'}
        </button>
      </div>
    </div>
  );
}
