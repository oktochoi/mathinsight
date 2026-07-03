import { ProductPageContent } from '@/components/marketing/pages/ProductPageContent';
import { buildMarketingMetadata } from '@/lib/marketing/seo';

export const metadata = buildMarketingMetadata('product');

export default function ProductPage() {
  return <ProductPageContent />;
}
