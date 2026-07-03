import { redirect } from 'next/navigation';
import { buildRedirectMetadata } from '@/lib/marketing/seo';

export const metadata = buildRedirectMetadata('demo');

export default function DemoPage() {
  redirect('/product#tour');
}
