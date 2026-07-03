import { COMPANY_DOMAIN } from '@/lib/brand';

const INVALID_HOSTS = new Set(['0.0.0.0', '127.0.0.1']);
const OFFICIAL_SITE_ORIGIN = `https://${COMPANY_DOMAIN}`;

/** 브라우저·OAuth에서 쓰면 안 되는 호스트 */
export function isInvalidPublicHost(hostname: string): boolean {
  return INVALID_HOSTS.has(hostname);
}

/** 프로덕션에서 구 Vercel 기본 도메인(.vercel.app)은 공식 도메인으로 대체 */
function isLegacyVercelOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

/** 절대 URL origin 정규화 (0.0.0.0 등 제외) */
export function normalizeSiteOrigin(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    if (isInvalidPublicHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function resolveConfiguredOrigin(raw: string | undefined): string | null {
  const origin = normalizeSiteOrigin(raw);
  if (!origin) return null;
  if (process.env.VERCEL_ENV === 'production' && isLegacyVercelOrigin(origin)) {
    return null;
  }
  return origin;
}

/** Vercel·.env에 설정된 공개 사이트 URL (서버·클라이언트 공통) */
export function getConfiguredSiteOrigin(): string | null {
  if (process.env.VERCEL_ENV === 'production') {
    const fromEnv = resolveConfiguredOrigin(process.env.NEXT_PUBLIC_SITE_URL);
    if (fromEnv) return fromEnv;
    return OFFICIAL_SITE_ORIGIN;
  }

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    const origin = resolveConfiguredOrigin(raw);
    if (origin) return origin;
  }
  return null;
}

/** 클라이언트 OAuth redirectTo — env 우선, 0.0.0.0 미사용 */
export function getClientSiteOrigin(): string {
  const configured = getConfiguredSiteOrigin();
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const fromBrowser = normalizeSiteOrigin(window.location.origin);
    if (fromBrowser) {
      if (process.env.NODE_ENV === 'production' && isLegacyVercelOrigin(fromBrowser)) {
        return OFFICIAL_SITE_ORIGIN;
      }
      return fromBrowser;
    }
  }

  return 'http://localhost:3000';
}

/** Route Handler·Middleware — 요청 헤더·env 기준 (request.url의 0.0.0.0 무시) */
export function getRequestSiteOrigin(request: Request): string {
  const configured = getConfiguredSiteOrigin();
  if (configured) return configured;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = forwardedHost ?? request.headers.get('host');
  if (hostHeader) {
    const hostname = hostHeader.split(',')[0].trim().split(':')[0];
    if (!isInvalidPublicHost(hostname)) {
      const proto =
        request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ??
        (hostname.includes('localhost') ? 'http' : 'https');
      const origin = normalizeSiteOrigin(`${proto}://${hostHeader.split(',')[0].trim()}`);
      if (origin) {
        if (process.env.VERCEL_ENV === 'production' && isLegacyVercelOrigin(origin)) {
          return OFFICIAL_SITE_ORIGIN;
        }
        return origin;
      }
    }
  }

  const fromUrl = normalizeSiteOrigin(new URL(request.url).origin);
  if (fromUrl) {
    if (process.env.VERCEL_ENV === 'production' && isLegacyVercelOrigin(fromUrl)) {
      return OFFICIAL_SITE_ORIGIN;
    }
    return fromUrl;
  }

  return process.env.VERCEL_ENV === 'production' ? OFFICIAL_SITE_ORIGIN : 'http://localhost:3000';
}

export function absolutePath(path: string, origin: string): string {
  return new URL(path.startsWith('/') ? path : `/${path}`, origin).toString();
}
