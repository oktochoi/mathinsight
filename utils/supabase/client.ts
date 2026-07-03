import { createBrowserClient } from '@supabase/ssr';

const BUILD_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const BUILD_PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.placeholder';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // anon JWT(eyJ...) 우선 — publishable(sb_publishable_)은 일부 환경에서 거부될 수 있음
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return { url, key };
}

export const createClient = () => {
  const { url, key } = getEnv();

  if (url && key) {
    return createBrowserClient(url, key);
  }

  // Vercel 빌드 시 env 미설정이어도 prerender 통과 (런타임은 Vercel env 필수)
  if (typeof window === 'undefined') {
    return createBrowserClient(BUILD_PLACEHOLDER_URL, BUILD_PLACEHOLDER_KEY);
  }

  throw new Error(
    '@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) are required.'
  );
};
