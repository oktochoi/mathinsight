import { BlogIndexPageContent } from '@/components/marketing/pages/BlogIndexPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('blog');

export default function BlogPage() {
  return <BlogIndexPageContent />;
}
