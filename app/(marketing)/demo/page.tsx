import type { Metadata } from 'next';
import { DemoPageContent } from '@/components/marketing/pages/DemoPageContent';

export const metadata: Metadata = {
  title: 'Demo — EduFlow',
  description: '로그인 없이 Dashboard, Student Hub, AI 상담 카드, Parent Report 체험.',
};

export default function DemoPage() {
  return <DemoPageContent />;
}
