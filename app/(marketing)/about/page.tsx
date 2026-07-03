import { AboutPageContent } from '@/components/marketing/pages/AboutPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('about');

export default function AboutPage() {
  return <AboutPageContent />;
}
