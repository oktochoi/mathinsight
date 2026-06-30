'use client';

import { ClassesSection } from '@/components/settings/ClassesSection';
import { PageHeader } from '@/components/ui/PageHeader';
import { STAFF_PAGES } from '@/lib/staffPages';

const meta = STAFF_PAGES.classes;

export default function ClassesPageClient() {
  return (
    <div className="space-y-5 w-full min-w-0 max-w-full">
      <PageHeader title={meta.title} description={meta.description} />
      <ClassesSection />
    </div>
  );
}
