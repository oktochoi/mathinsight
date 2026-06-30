import { MockPaymentProvider } from './mockProvider';
import { TossProvider } from './tossProvider';
import type { PaymentProvider } from './types';

export const paymentProvider: PaymentProvider =
  process.env.PAYMENT_PROVIDER === 'toss' ? new TossProvider() : new MockPaymentProvider();

export * from './types';
