import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { SmsProvider } from './types';

export const MOCK_SMS_CODE = '123456';
const TTL_MINUTES = 5;

export class MockSmsProvider implements SmsProvider {
  async send(phone: string) {
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    const { error } = await supabaseAdmin().from('phone_verifications').upsert(
      {
        phone,
        code: MOCK_SMS_CODE,
        expires_at: expiresAt.toISOString(),
        verified: false,
      },
      { onConflict: 'phone' }
    );

    if (error) return { ok: false, error: error.message };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS Mock] ${phone} → 인증번호: ${MOCK_SMS_CODE}`);
    }
    return { ok: true };
  }

  async verify(phone: string, code: string) {
    const { data } = await supabaseAdmin()
      .from('phone_verifications')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!data) return { ok: false, error: '인증 요청이 없습니다.' };
    if (new Date(data.expires_at) < new Date()) {
      return { ok: false, error: '인증번호가 만료됐습니다.' };
    }
    if (data.code !== code.trim()) {
      return { ok: false, error: '인증번호가 올바르지 않습니다.' };
    }

    await supabaseAdmin()
      .from('phone_verifications')
      .update({ verified: true })
      .eq('phone', phone);

    return { ok: true };
  }
}
