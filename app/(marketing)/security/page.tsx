import type { Metadata } from 'next';
import { SecurityPageContent } from '@/components/marketing/pages/SecurityPageContent';

export const metadata: Metadata = {
  title: 'Security — EduFlow',
  description: '개인정보, 권한, AI 데이터 사용 원칙.',
};

export default function SecurityPage() {
  return <SecurityPageContent />;
}
