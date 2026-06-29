import type { Metadata } from 'next';
import { ProductPageContent } from '@/components/marketing/pages/ProductPageContent';

export const metadata: Metadata = {
  title: 'Product — EduFlow',
  description: '학생 기록이 상담 준비가 되는 AI Native 학원 운영 SaaS — Workflow, 기능, AI Assistant를 하나의 스토리로.',
};

export default function ProductPage() {
  return <ProductPageContent />;
}
