import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/marketing/pages/ContactPageContent';

export const metadata: Metadata = {
  title: 'Contact — EduFlow',
  description: '도입·데모·Enterprise 문의.',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
