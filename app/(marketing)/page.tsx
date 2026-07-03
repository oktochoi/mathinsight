import { HomePageContent } from '@/components/marketing/pages/HomePageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('home');

export default function HomePage() {
  return <HomePageContent />;
}
