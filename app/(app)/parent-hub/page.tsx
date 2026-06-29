import { Suspense } from 'react';
import ParentHubClient from './PageClient';

export default function ParentHubPage() {
  return (
    <Suspense>
      <ParentHubClient />
    </Suspense>
  );
}
