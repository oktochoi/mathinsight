import type { Metadata } from 'next';
import { LegalPageContent } from '@/components/marketing/pages/LegalPageContent';

export const metadata: Metadata = {
  title: 'Terms — EduFlow',
};

export default function TermsPage() {
  return <LegalPageContent type="terms" />;
}
