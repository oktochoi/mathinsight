import { redirect } from 'next/navigation';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

export default function WorkflowPage() {
  redirect(`${MARKETING_ROUTES.product}#workflow`);
}
