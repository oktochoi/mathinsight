import { redirect } from 'next/navigation';
import { buildRedirectMetadata } from '@/lib/marketing/seo';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

export const metadata = buildRedirectMetadata('ai');

export default function AiPage() {
  redirect(`${MARKETING_ROUTES.product}#ai`);
}
