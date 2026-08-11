import { AcademyManagementPageContent } from '@/components/marketing/pages/AcademyManagementPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('academyManagement');

export default function AcademyManagementPage() {
  return <AcademyManagementPageContent />;
}
