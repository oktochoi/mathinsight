import { ContactPageContent } from '@/components/marketing/pages/ContactPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('contact');

export default function ContactPage() {
  return <ContactPageContent />;
}
