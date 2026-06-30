import { Suspense } from 'react';
import { ParentReportsPageContent } from './PageClient';
import { PageLoader } from '@/components/ui/DataStates';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ParentReportsPageContent />
    </Suspense>
  );
}
