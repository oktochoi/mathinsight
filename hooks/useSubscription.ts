'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PlanId, SubscriptionStatus } from '@/lib/payment/types';

export type SubscriptionState = {
  status: SubscriptionStatus | null;
  plan: string | null;
  daysLeft: number | null;
  allowed: boolean;
  reason: string | null;
  isOwner: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [allowed, setAllowed] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscription/status');
      const data = (await res.json()) as {
        status?: SubscriptionStatus | null;
        plan?: string | null;
        daysLeft?: number | null;
        allowed?: boolean;
        reason?: string | null;
        isOwner?: boolean;
        trialEndsAt?: string | null;
        currentPeriodEnd?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? '구독 정보를 불러오지 못했습니다.');
        return;
      }
      setStatus(data.status ?? null);
      setPlan(data.plan ?? null);
      setDaysLeft(data.daysLeft ?? null);
      setAllowed(data.allowed ?? true);
      setReason(data.reason ?? null);
      setIsOwner(data.isOwner ?? false);
      setTrialEndsAt(data.trialEndsAt ?? null);
      setCurrentPeriodEnd(data.currentPeriodEnd ?? null);
    } catch {
      setError('구독 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    plan,
    daysLeft,
    allowed,
    reason,
    isOwner,
    trialEndsAt,
    currentPeriodEnd,
    loading,
    error,
    refresh,
  };
}

export type { PlanId };
