'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlanId } from '@/lib/payment/types';

const IS_TOSS = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'toss';

export function MockPayButton({
  plan,
  disabled,
}: {
  plan: PlanId;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; redirectUrl?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? '결제 처리에 실패했습니다.');
        return;
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void handlePay()}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors cursor-pointer"
      >
        {busy ? '처리 중…' : IS_TOSS ? 'Toss로 결제하기' : 'Mock 결제 완료 (테스트용)'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <p className="text-[11px] text-stone-400 text-center">
        {IS_TOSS
          ? 'Toss 결제창에서 카드 결제 후 구독이 활성화됩니다.'
          : '실제 카드 결제 없이 30일 이용권이 활성화됩니다.'}
      </p>
    </div>
  );
}
