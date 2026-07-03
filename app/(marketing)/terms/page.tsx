import { LegalPageContent } from '@/components/marketing/pages/LegalPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('terms');

export default function TermsPage() {
  return <LegalPageContent type="terms" />;
}
