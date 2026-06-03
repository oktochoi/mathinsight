'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { StaffPageKey } from '@/lib/staffPages';
import { STAFF_PAGE_PLAYBOOK } from '@/lib/staffWorkflow';
import { cn } from '@/lib/cn';

type LegendItem = { label: string; desc: string };

export function StaffPageIntro({
  pageKey,
  legend,
}: {
  pageKey: StaffPageKey;
  legend?: LegendItem[];
}) {
  const [open, setOpen] = useState(false);
  const book = STAFF_PAGE_PLAYBOOK[pageKey];

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-relaxed">
            <span className="font-semibold text-indigo-900">이 화면: </span>
            {book.role}
          </p>
          <ul className="mt-2 text-xs text-slate-600 space-y-0.5">
            {book.tasks.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
        <Link
          href={book.primaryHref}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shrink-0 min-h-[44px]"
        >
          {book.primaryLabel}
          <i className="ri-arrow-right-line" aria-hidden />
        </Link>
      </div>
      {(legend?.length ?? 0) > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full px-4 py-2 text-xs text-indigo-700 border-t border-indigo-100/80 hover:bg-indigo-50/60 cursor-pointer flex items-center justify-center gap-1"
          >
            용어·배지 설명
            <i className={cn('ri-arrow-down-s-line', open && 'rotate-180')} aria-hidden />
          </button>
          {open && (
            <dl className="px-4 pb-4 grid sm:grid-cols-2 gap-2 border-t border-indigo-100/80 bg-white/50">
              {legend!.map((item) => (
                <div key={item.label} className="text-xs rounded-lg bg-white border border-slate-100 p-2.5">
                  <dt className="font-semibold text-slate-800">{item.label}</dt>
                  <dd className="text-slate-500 mt-0.5 leading-snug">{item.desc}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </div>
  );
}
