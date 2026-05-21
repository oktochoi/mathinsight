import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseBrowserClient();
  }
  return _client;
}

/** Client Component용 브라우저 Supabase (첫 사용 시 생성 — 빌드 prerender 안전) */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

export { createSupabaseBrowserClient as createClient };
