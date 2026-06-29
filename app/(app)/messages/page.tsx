import { Suspense } from 'react';
import PageClient from './PageClient';
import { PageLoader } from '@/components/ui/DataStates';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageClient />
    </Suspense>
  );
}
