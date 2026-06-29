import type { Metadata } from 'next';
import { CustomersPageContent } from '@/components/marketing/pages/CustomersPageContent';

export const metadata: Metadata = {
  title: 'Customers — EduFlow',
  description: '파일럿 준비 중 — 원장 인터뷰와 Before/After.',
};

export default function CustomersPage() {
  return <CustomersPageContent />;
}
