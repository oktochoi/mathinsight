import type { Metadata } from 'next';
import { AboutPageContent } from '@/components/marketing/pages/AboutPageContent';

export const metadata: Metadata = {
  title: 'About — EduFlow',
  description: 'EduFlow 철학 — ERP가 아닌 AI 상담 운영 시스템.',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
