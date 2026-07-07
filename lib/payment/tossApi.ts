import { SITE_URL } from '@/lib/brand';

export function getTossKeys() {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  const clientKey =
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() || process.env.TOSS_CLIENT_KEY?.trim();
  return { secretKey, clientKey };
}

export function tossConfigured() {
  const { secretKey, clientKey } = getTossKeys();
  return Boolean(secretKey && clientKey);
}

function authHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const { secretKey } = getTossKeys();
  if (!secretKey) return { ok: false as const, error: 'Toss 시크릿 키가 없습니다.' };

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: authHeader(secretKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as { message?: string; code?: string };
  if (!res.ok) {
    return { ok: false as const, error: data.message ?? '결제 승인에 실패했습니다.' };
  }
  return { ok: true as const };
}

export function subscribePayUrls(orderId: string) {
  const base = SITE_URL.replace(/\/$/, '');
  return {
    successUrl: `${base}/subscribe/success`,
    failUrl: `${base}/subscribe?reason=past_due`,
  };
}
