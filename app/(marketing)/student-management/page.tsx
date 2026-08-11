import { StudentManagementPageContent } from '@/components/marketing/pages/StudentManagementPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('studentManagement');

export default function StudentManagementPage() {
  return <StudentManagementPageContent />;
}
