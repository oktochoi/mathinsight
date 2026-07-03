import { BRAND_NAME, BRAND_TAGLINE, SITE_URL } from '@/lib/brand';

/** public/ 정적 자산 경로 (파일명 교체 시 SEO 설정은 그대로 유지) */
export const SITE_FAVICON = '/favicon.ico';
export const SITE_APPLE_TOUCH_ICON = '/apple-touch-icon.png';
export const SITE_OG_IMAGE = '/og-image.png';
export const SITE_LOGO = '/logo.png';
export const SITE_MANIFEST = '/manifest.webmanifest';
export const SITE_LLMS_TXT = '/llms.txt';

export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;
export const SITE_OG_IMAGE_ALT = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

export const SITE_OG_IMAGE_ABSOLUTE = `${SITE_URL}${SITE_OG_IMAGE}`;

export const SITE_THEME_COLOR = '#0284c7';
