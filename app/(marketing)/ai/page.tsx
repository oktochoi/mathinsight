import { redirect } from 'next/navigation';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

export default function AiPage() {
  redirect(`${MARKETING_ROUTES.product}#ai`);
}
