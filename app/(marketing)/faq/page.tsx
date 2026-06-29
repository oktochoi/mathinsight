import type { Metadata } from 'next';
import { FaqPageContent } from '@/components/marketing/pages/FaqPageContent';

export const metadata: Metadata = {
  title: 'FAQ — EduFlow',
  description: '엑셀 이전, ERP 병행, AI 데이터, 보안, 무료 체험.',
};

export default function FaqPage() {
  return <FaqPageContent />;
}
