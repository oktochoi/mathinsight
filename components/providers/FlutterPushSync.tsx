'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { flutterBridge } from '@/lib/flutterBridge';

async function registerPushToken(token: string, platform?: 'android' | 'ios') {
  await fetch('/api/push/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: platform ?? 'android' }),
  });
}

/** Flutter WebView FCM 토큰 등록·갱신·로그아웃 정리 */
export function FlutterPushSync() {
  const { profile } = useAuth();
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const syncToken = async (token: string | null | undefined) => {
      if (!token?.trim()) return;
      lastTokenRef.current = token.trim();
      await registerPushToken(token.trim());
    };

    window.onFcmToken = async (token: string) => {
      await syncToken(token);
    };

    void (async () => {
      if (flutterBridge.isFlutter) {
        const token = await flutterBridge.getFcmToken();
        await syncToken(token);
      }
    })();

    const offBridge = flutterBridge.onMessage<{ token: string }>('FCM_TOKEN', ({ token }) => {
      void syncToken(token);
    });

    return () => {
      offBridge();
      delete window.onFcmToken;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) return;

    const token = lastTokenRef.current;
    if (token) {
      void fetch(`/api/push/token?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
      lastTokenRef.current = null;
    }
  }, [profile?.id]);

  return null;
}
