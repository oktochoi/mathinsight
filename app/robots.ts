import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';

/** 인증·앱 영역 — 검색 크롤링 제외 */
const DISALLOW_PATHS = [
  '/api/',
  '/auth/',
  '/auth/callback',
  '/login',
  '/signup',
  '/onboarding',
  '/dashboard',
  '/parent',
  '/student',
  '/reset-password',
  '/forgot-password',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace('https://', ''),
  };
}
