import { redirect } from 'next/navigation';

/** /auth → /login 또는 /signup (레거시 URL 호환) */
export default async function AuthIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'mode') continue;
    if (typeof value === 'string') q.set(key, value);
    else if (Array.isArray(value) && value[0]) q.set(key, value[0]);
  }
  const query = q.toString();
  const suffix = query ? `?${query}` : '';

  if (params.mode === 'signup') {
    redirect(`/signup${suffix}`);
  }
  redirect(`/login${suffix}`);
}
