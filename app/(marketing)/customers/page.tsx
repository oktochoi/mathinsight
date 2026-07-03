import { CustomersPageContent } from '@/components/marketing/pages/CustomersPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('customers');

export default function CustomersPage() {
  return <CustomersPageContent />;
}
