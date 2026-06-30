'use client';

import { useCallback, useRef, useState } from 'react';

export function useToast(duration = 3000) {
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage(msg);
      timerRef.current = setTimeout(() => {
        setMessage('');
        timerRef.current = null;
      }, duration);
    },
    [duration]
  );

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage('');
  }, []);

  return { message, show, clear };
}
