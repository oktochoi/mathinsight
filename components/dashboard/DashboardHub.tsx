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
    <section className="rounded-2xl p-5" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--app-ink)' }}>메뉴 바로가기</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--app-ink-3)' }}>각 화면에서 할 일이 안내 패널에 적혀 있습니다.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {HUB_KEYS.map((key) => {
          const p = STAFF_PAGES[key];
          return (
            <Link
              key={key}
              href={p.href}
              className="flex gap-3 p-4 rounded-xl transition-all group hover:bg-[var(--app-accent-bg)]"
              style={{ border: '1px solid var(--app-border)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--app-surface-2)' }}>
                <i className={`${p.icon} text-lg`} style={{ color: 'var(--app-ink-2)' }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--app-ink)' }}>{p.title}</p>
                <p className="text-xs mt-0.5 leading-snug line-clamp-2" style={{ color: 'var(--app-ink-3)' }}>
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
