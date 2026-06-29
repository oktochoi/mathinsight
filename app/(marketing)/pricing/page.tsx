import type { Metadata } from 'next';
import { PricingPageContent } from '@/components/marketing/pages/PricingPageContent';

export const metadata: Metadata = {
  title: 'Pricing — EduFlow',
  description: 'Starter, Pro, Enterprise — 학원 규모별 요금.',
};

export default function PricingPage() {
  return <PricingPageContent />;
}
