import { LegalPageContent } from '@/components/marketing/pages/LegalPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('privacy');

export default function PrivacyPage() {
  return <LegalPageContent type="privacy" />;
}
