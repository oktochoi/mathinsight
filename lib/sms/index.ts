import { MockSmsProvider } from './mockProvider';
import { SolapiProvider } from './solapiProvider';
import type { SmsProvider } from './types';

export const smsProvider: SmsProvider =
  process.env.SMS_PROVIDER === 'solapi' ? new SolapiProvider() : new MockSmsProvider();

export { MOCK_SMS_CODE } from './mockProvider';
