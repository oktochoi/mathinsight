import { AcademyConsultingPageContent } from '@/components/marketing/pages/AcademyConsultingPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('academyConsulting');

export default function AcademyConsultingPage() {
  return <AcademyConsultingPageContent />;
}
