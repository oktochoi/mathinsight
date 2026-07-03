import { getFirebaseMessaging } from '@/lib/push/firebaseAdmin';

export type FcmPayload = {
  title: string;
  body: string;
  url?: string;
};

export type FcmSendResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  reason?: string;
};

async function sendFcmV1(
  tokens: string[],
  payload: FcmPayload
): Promise<FcmSendResult | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  const messages = tokens.map((token) => ({
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.url ? { url: payload.url } : undefined,
    webpush: payload.url
      ? { fcmOptions: { link: payload.url } }
      : undefined,
  }));

  const batch = await messaging.sendEach(messages);
  return {
    sent: batch.successCount,
    failed: batch.failureCount,
    skipped: false,
  };
}

/** Legacy FCM HTTP API */
async function sendFcmLegacy(
  tokens: string[],
  payload: FcmPayload
): Promise<FcmSendResult | null> {
  const key = process.env.FCM_SERVER_KEY?.trim();
  if (!key) return null;

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: { title: payload.title, body: payload.body },
          data: payload.url ? { url: payload.url } : undefined,
        }),
      });
      if (res.ok) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, failed, skipped: false };
}

/**
 * FCM 푸시 발송.
 * 우선순위: FIREBASE_SERVICE_ACCOUNT_JSON (HTTP v1) → FCM_SERVER_KEY (구식)
 */
export async function sendFcmToTokens(
  tokens: string[],
  payload: FcmPayload
): Promise<FcmSendResult> {
  const unique = [...new Set(tokens.filter(Boolean))];

  if (unique.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'no_tokens' };
  }

  const v1 = await sendFcmV1(unique, payload);
  if (v1) return v1;

  const legacy = await sendFcmLegacy(unique, payload);
  if (legacy) return legacy;

  return { sent: 0, failed: 0, skipped: true, reason: 'fcm_not_configured' };
}
