import type { Metadata } from 'next';
import { LegalPageContent } from '@/components/marketing/pages/LegalPageContent';

export const metadata: Metadata = {
  title: 'Privacy Policy — EduFlow',
};

export default function PrivacyPage() {
  return <LegalPageContent type="privacy" />;
}
