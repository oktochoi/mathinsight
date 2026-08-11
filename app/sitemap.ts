import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/brand';
import { MARKETING_SITEMAP_PATHS } from '@/lib/marketing/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = MARKETING_SITEMAP_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: path === '/' || path === '/product' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : ['/product', '/academy-management', '/academy-consulting', '/student-management', '/re-enrollment'].includes(path) ? 0.9 : path === '/blog' ? 0.8 : 0.7,
  }));

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const { BLOG_POSTS } = await import('@/lib/marketing/blogPosts');
    blogPages = BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // blogPosts module not yet created
  }

  return [...staticPages, ...blogPages];
}
