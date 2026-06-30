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

/** Legacy FCM HTTP API — FCM_SERVER_KEY 미설정 시 skipped */
export async function sendFcmToTokens(
  tokens: string[],
  payload: FcmPayload
): Promise<FcmSendResult> {
  const key = process.env.FCM_SERVER_KEY?.trim();
  const unique = [...new Set(tokens.filter(Boolean))];

  if (unique.length === 0) {
    return { sent: 0, failed: 0, skipped: true, reason: 'no_tokens' };
  }
  if (!key) {
    return { sent: 0, failed: 0, skipped: true, reason: 'fcm_not_configured' };
  }

  let sent = 0;
  let failed = 0;

  for (const token of unique) {
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
