'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type PushDetail = { title: string; body: string };

export function PushInAppBanner() {
  const [note, setNote] = useState<PushDetail | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const onPush = (event: Event) => {
      const detail = (event as CustomEvent<PushDetail>).detail;
      if (!detail?.title) return;
      setNote(detail);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setNote(null), 6000);
    };
    window.addEventListener('eduflow:push', onPush);
    return () => {
      window.removeEventListener('eduflow:push', onPush);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!note) return null;

  return (
    <div
      className={cn(
        'fixed left-4 right-4 z-[60] mx-auto max-w-md',
        'rounded-xl px-4 py-3 shadow-lg app-banner-info mobile-top-safe'
      )}
      style={{ top: '0.75rem' }}
      role="status"
    >
      <p className="text-sm font-semibold app-text-info">{note.title}</p>
      {note.body && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-2)' }}>
          {note.body}
        </p>
      )}
    </div>
  );
}
