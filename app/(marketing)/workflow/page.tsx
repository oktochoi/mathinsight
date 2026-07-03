import { redirect } from 'next/navigation';
import { buildRedirectMetadata } from '@/lib/marketing/seo';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

export const metadata = buildRedirectMetadata('workflow');

export default function WorkflowPage() {
  redirect(`${MARKETING_ROUTES.product}#workflow`);
}
