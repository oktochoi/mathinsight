/** 클라이언트 로그인·OAuth 직후 이동 경로 조회 */
export async function fetchPostAuthDestination(
  next?: string | null,
  _rawDbRole?: string | null
): Promise<string> {
  const qs = next ? `?next=${encodeURIComponent(next)}` : '';
  const res = await fetch(`/api/auth/post-login-destination${qs}`);
  const data = (await res.json()) as { path?: string };
  return data.path ?? '/dashboard';
}
