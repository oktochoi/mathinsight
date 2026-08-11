import { RetentionPageContent } from '@/components/marketing/pages/RetentionPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('retention');

export default function RetentionPage() {
  return <RetentionPageContent />;
}
