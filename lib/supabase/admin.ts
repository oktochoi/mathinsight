import { createClient } from '@supabase/supabase-js';

/** Cron·배치 전용 — SUPABASE_SERVICE_ROLE_KEY (서버만) */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
