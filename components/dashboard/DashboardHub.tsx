'use client';

import Link from 'next/link';
import { STAFF_PAGES, type StaffPageKey } from '@/lib/staffPages';

const HUB_KEYS: StaffPageKey[] = [
  'schedule',
  'students',
  'lesson-logs',
  'consultation-cards',
  'parent-reports',
  'settings',
];

export function DashboardHub() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">메뉴 바로가기</h2>
      <p className="text-xs text-slate-500 mb-4">각 화면에서 할 일이 안내 패널에 적혀 있습니다.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HUB_KEYS.map((key) => {
          const p = STAFF_PAGES[key];
          return (
            <Link
              key={key}
              href={p.href}
              className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center shrink-0">
                <i className={`${p.icon} text-lg text-slate-600 group-hover:text-indigo-700`} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                  {p.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
