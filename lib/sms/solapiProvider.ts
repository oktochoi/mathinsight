import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendSolapiSms } from './solapiApi';
import type { SmsProvider } from './types';

const TTL_MINUTES = 5;

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class SolapiProvider implements SmsProvider {
  async send(phone: string) {
    const code = randomCode();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

    const { error } = await supabaseAdmin().from('phone_verifications').upsert(
      {
        phone,
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
      },
      { onConflict: 'phone' }
    );

    if (error) return { ok: false as const, error: error.message };

    const sent = await sendSolapiSms(phone, `[EduFlow] 인증번호 ${code} (5분 내 입력)`);
    if (!sent.ok) return sent;

    return { ok: true as const };
  }

  async verify(phone: string, code: string) {
    const { data } = await supabaseAdmin()
      .from('phone_verifications')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!data) return { ok: false as const, error: '인증 요청이 없습니다.' };
    if (new Date(data.expires_at) < new Date()) {
      return { ok: false as const, error: '인증번호가 만료됐습니다.' };
    }
    if (data.code !== code.trim()) {
      return { ok: false as const, error: '인증번호가 올바르지 않습니다.' };
    }

    await supabaseAdmin()
      .from('phone_verifications')
      .update({ verified: true })
      .eq('phone', phone);

    return { ok: true as const };
  }
}
