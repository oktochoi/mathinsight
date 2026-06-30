import { createAdminClient } from '@/lib/supabase/admin';

/** 서버 전용 Supabase (service role) */
export function supabaseAdmin() {
  const client = createAdminClient();
  if (!client) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  }
  return client;
}
