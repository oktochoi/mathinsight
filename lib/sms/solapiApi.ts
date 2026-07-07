import { randomBytes, createHmac } from 'crypto';

function solapiAuth() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim() || process.env.SOLAPI_SECRET?.trim();
  const from = process.env.SOLAPI_SENDER_PHONE?.trim() || process.env.SENDER_PHONE?.trim();
  return { apiKey, apiSecret, from };
}

export function solapiConfigured() {
  const { apiKey, apiSecret, from } = solapiAuth();
  return Boolean(apiKey && apiSecret && from);
}

function buildAuthorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function sendSolapiSms(to: string, text: string) {
  const { apiKey, apiSecret, from } = solapiAuth();
  if (!apiKey || !apiSecret || !from) {
    return { ok: false as const, error: 'Solapi 환경 변수가 설정되지 않았습니다.' };
  }

  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      Authorization: buildAuthorization(apiKey, apiSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { to, from, text },
    }),
  });

  const data = (await res.json()) as { errorCode?: string; errorMessage?: string };
  if (!res.ok) {
    return {
      ok: false as const,
      error: data.errorMessage ?? data.errorCode ?? 'SMS 발송에 실패했습니다.',
    };
  }
  return { ok: true as const };
}
