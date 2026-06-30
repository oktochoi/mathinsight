import type { PaymentProvider, PlanId } from './types';

export class TossProvider implements PaymentProvider {
  async subscribe(_params: { academyId: string; plan: PlanId }) {
    return { ok: false as const, error: 'Toss 미연동 — PAYMENT_PROVIDER=toss 설정 후 구현 필요' };
  }

  async cancel(_academyId: string) {
    return { ok: false as const, error: 'Toss 미연동' };
  }
}
