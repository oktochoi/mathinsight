export interface SmsProvider {
  send(phone: string): Promise<{ ok: boolean; error?: string }>;
  verify(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
}
