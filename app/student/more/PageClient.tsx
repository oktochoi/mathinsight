'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { STUDENT_MORE_NAV } from '@/lib/studentPortalNav';
import { StudentPortalGate } from '@/components/portal/StudentPortalGate';

function Content() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900 px-1">더보기</h1>
      <div className="student-card divide-y divide-sky-50 overflow-hidden">
        {STUDENT_MORE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-5 py-4 hover:bg-sky-50/50 transition-colors"
          >
            <i className={cn(item.icon, 'text-lg text-sky-600')} aria-hidden />
            <span className="text-sm font-semibold text-slate-800">{item.label}</span>
            <i className="ri-arrow-right-s-line text-slate-400 ml-auto" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PageClient() {
  return <StudentPortalGate>{() => <Content />}</StudentPortalGate>;
}
