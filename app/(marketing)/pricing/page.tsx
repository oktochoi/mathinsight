import { PricingPageContent } from '@/components/marketing/pages/PricingPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('pricing');

export default function PricingPage() {
  return <PricingPageContent />;
}
