import { redirect } from 'next/navigation';
import { buildRedirectMetadata } from '@/lib/marketing/seo';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

export const metadata = buildRedirectMetadata('resources');

export default function ResourcesPage() {
  redirect(`${MARKETING_ROUTES.product}#features`);
}
