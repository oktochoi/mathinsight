'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlanSelector } from '@/components/subscription/PlanSelector';
import { MockPayButton } from '@/components/subscription/MockPayButton';
import { DevTools } from '@/components/subscription/DevTools';
import { useSubscription } from '@/hooks/useSubscription';
import type { PlanId } from '@/lib/payment/types';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

const REASON_COPY: Record<string, { title: string; desc: string }> = {
  trial_expired: {
    title: '3일 무료 체험이 종료됐습니다',
    desc: '플랜을 선택하고 결제하면 바로 이용을 재개할 수 있습니다.',
  },
  past_due: {
    title: '결제에 문제가 생겼습니다',
    desc: '결제 수단을 확인하거나 플랜을 다시 선택해 주세요.',
  },
  canceled: {
    title: '구독이 해지됐습니다',
    desc: '다시 구독하면 학원 운영 기능을 이용할 수 있습니다.',
  },
  expired: {
    title: '구독 기간이 만료됐습니다',
    desc: '플랜을 선택해 주세요.',
  },
  no_subscription: {
    title: '구독 정보가 없습니다',
    desc: '원장 계정으로 플랜을 선택해 주세요.',
  },
};

export default function SubscribePageClient() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? 'trial_expired';
  const { isOwner, loading } = useSubscription();
  const [plan, setPlan] = useState<PlanId>('starter');

  const banner = useMemo(
    () => REASON_COPY[reason] ?? REASON_COPY.trial_expired,
    [reason]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">EduFlow 구독</p>
        {PROMO_ALL_FREE.active ? (
          <>
            <h1 className="text-2xl font-bold text-green-700">{PROMO_ALL_FREE.title}</h1>
            <p className="text-sm text-stone-600">{PROMO_ALL_FREE.subtitle}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-stone-900">{banner.title}</h1>
            <p className="text-sm text-stone-500">{banner.desc}</p>
          </>
        )}
      </div>

      <PlanSelector selected={plan} onSelect={setPlan} />

      <div className="max-w-md mx-auto">
        {loading ? (
          <p className="text-sm text-center text-stone-400">불러오는 중…</p>
        ) : isOwner ? (
          <MockPayButton plan={plan} />
        ) : (
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-center text-sm text-stone-600">
            결제는 <strong>원장 계정</strong>에서만 가능합니다. 학원 원장님께 문의해 주세요.
          </div>
        )}
      </div>

      <DevTools />
    </div>
  );
}
