'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'mathinsight_web_push_dismissed';

async function registerWebPushToken(token: string) {
  const res = await fetch('/api/push/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: 'web' }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? '토큰 등록 실패');
  }
}

/** 브라우저 네이티브 알림 권한 요청 (웹 전용 보조 채널) */
export function WebPushBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const requestPermission = async () => {
    setLoading(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('알림이 차단되었습니다. 브라우저 설정에서 허용해 주세요.');
        return;
      }
      const token = `web:${crypto.randomUUID()}`;
      await registerWebPushToken(token);
      localStorage.setItem(DISMISS_KEY, '1');
      setVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="parent-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-indigo-100 bg-indigo-50/60">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <i className="ri-notification-3-line text-lg" />
        </span>
        <div>
          <p className="text-sm font-semibold text-stone-900">중요 알림을 놓치지 마세요</p>
          <p className="text-xs text-stone-600 mt-0.5">
            앱 설치 전에도 브라우저로 출결·숙제 알림을 받을 수 있습니다.
          </p>
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          disabled={loading}
          onClick={() => void requestPermission()}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? '처리 중…' : '알림 허용'}
        </button>
        <button type="button" onClick={dismiss} className="px-3 py-2 text-sm text-stone-500">
          나중에
        </button>
      </div>
    </div>
  );
}
