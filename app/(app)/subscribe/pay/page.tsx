'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscribePayUrls } from '@/lib/payment/tossApi';
import type { PlanId } from '@/lib/payment/types';

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}

function TossPayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId') ?? '';
  const plan = (searchParams.get('plan') ?? 'starter') as PlanId;
  const amount = Number(searchParams.get('amount') ?? 0);
  const orderName = searchParams.get('orderName') ?? 'EduFlow 구독';
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

  useEffect(() => {
    if (started.current || !orderId || !amount || !clientKey) return;
    started.current = true;

    const run = async () => {
      try {
        if (!window.TossPayments) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.tosspayments.com/v1/payment';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('결제 SDK를 불러오지 못했습니다.'));
            document.body.appendChild(script);
          });
        }

        const toss = window.TossPayments!(clientKey);
        const { successUrl, failUrl } = subscribePayUrls(orderId);
        await toss.requestPayment('카드', {
          amount,
          orderId,
          orderName,
          successUrl,
          failUrl,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : '결제창을 열지 못했습니다.');
      }
    };

    void run();
  }, [orderId, amount, orderName, clientKey]);

  if (!orderId || !amount) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-stone-600">결제 정보가 올바르지 않습니다.</p>
        <button
          type="button"
          onClick={() => router.replace('/subscribe')}
          className="text-sm text-indigo-600 font-semibold"
        >
          구독 페이지로 돌아가기
        </button>
      </div>
    );
  }

  if (!clientKey) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-sm text-red-600">Toss 클라이언트 키가 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-3">
      <p className="text-sm text-stone-600">Toss 결제창을 여는 중입니다…</p>
      <p className="text-xs text-stone-400">
        {plan} · ₩{amount.toLocaleString()}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function SubscribePayPage() {
  return (
    <Suspense fallback={<p className="text-center py-16 text-sm text-stone-500">불러오는 중…</p>}>
      <TossPayInner />
    </Suspense>
  );
}
