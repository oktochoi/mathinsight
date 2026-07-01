export type PaymentPushType = 'created' | 'paid' | 'overdue';

export function notifyPaymentPush(paymentId: string, type: PaymentPushType) {
  void fetch('/api/push/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, type }),
  }).catch(() => {
    /* 푸시 실패는 청구 저장과 분리 */
  });
}

export async function notifyPaymentOverdueBulk(paymentIds: string[]): Promise<{
  ok: boolean;
  pushed?: number;
  error?: string;
}> {
  const ids = [...new Set(paymentIds.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: '발송할 청구가 없습니다.' };

  try {
    const res = await fetch('/api/push/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'overdue', paymentIds: ids }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      pushed?: number;
      error?: string;
      message?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? '푸시 발송에 실패했습니다.' };
    }
    return { ok: true, pushed: data.pushed };
  } catch {
    return { ok: false, error: '푸시 발송에 실패했습니다.' };
  }
}
