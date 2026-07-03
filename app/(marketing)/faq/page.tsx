import { FaqPageContent } from '@/components/marketing/pages/FaqPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('faq');

export default function FaqPage() {
  return <FaqPageContent />;
}
