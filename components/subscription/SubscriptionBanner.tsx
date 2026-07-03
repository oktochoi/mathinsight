'use client';

import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';
import { cn } from '@/lib/cn';

export function SubscriptionBanner() {
  const { status, daysLeft, loading } = useSubscription();

  if (loading) return null;

  if (PROMO_ALL_FREE.active) {
    return (
      <div className="shrink-0 px-4 py-2 text-center text-xs font-medium border-b bg-green-50 text-green-800 border-green-100">
        <strong>{PROMO_ALL_FREE.badge}</strong> — 현재 모든 플랜을 무료로 이용 중입니다.
      </div>
    );
  }

  if (status !== 'trialing' || daysLeft == null) return null;

  const urgent = daysLeft <= 1;

  return (
    <div
      className={cn(
        'shrink-0 px-4 py-2 text-center text-xs font-medium border-b',
        urgent
          ? 'bg-red-50 text-red-800 border-red-100'
          : 'bg-amber-50 text-amber-900 border-amber-100'
      )}
    >
      무료 체험{' '}
      <strong>D-{daysLeft}</strong> 남았습니다.{' '}
      <Link href="/subscribe" className="underline font-semibold hover:opacity-80">
        플랜 보기 →
      </Link>
    </div>
  );
}
