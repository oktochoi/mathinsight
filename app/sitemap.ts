import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';
import { MARKETING_SITEMAP_PATHS } from '@/lib/marketing/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return MARKETING_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/' || path === '/product' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/product' ? 0.9 : 0.7,
  }));
}
