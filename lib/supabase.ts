import { createClient } from '@/utils/supabase/client';

/** Client Component용 브라우저 Supabase 싱글톤 */
export const supabase = createClient();

export { createClient };
