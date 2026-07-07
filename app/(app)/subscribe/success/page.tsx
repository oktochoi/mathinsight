'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirmed = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (confirmed.current) return;
    confirmed.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount') ?? 0);

    if (!paymentKey || !orderId || !amount) {
      setError('결제 승인 정보가 부족합니다.');
      return;
    }

    const run = async () => {
      const res = await fetch('/api/subscription/toss/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? '결제 승인에 실패했습니다.');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    };

    void run();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-red-600">{error}</p>
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

  return <p className="text-center py-16 text-sm text-stone-600">결제를 확인하는 중입니다…</p>;
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={<p className="text-center py-16 text-sm text-stone-500">불러오는 중…</p>}>
      <SuccessInner />
    </Suspense>
  );
}
