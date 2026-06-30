import type { SmsProvider } from './types';

export class SolapiProvider implements SmsProvider {
  async send(_phone: string) {
    return { ok: false as const, error: 'Solapi 미연동 — SMS_PROVIDER=solapi 설정 후 구현 필요' };
  }

  async verify(_phone: string, _code: string) {
    return { ok: false as const, error: 'Solapi 미연동' };
  }
}
