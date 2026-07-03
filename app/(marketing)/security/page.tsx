import { SecurityPageContent } from '@/components/marketing/pages/SecurityPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('security');

export default function SecurityPage() {
  return <SecurityPageContent />;
}
