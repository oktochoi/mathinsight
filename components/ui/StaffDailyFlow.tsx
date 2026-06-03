'use client';

import Link from 'next/link';
import { STAFF_DAILY_FLOW } from '@/lib/staffWorkflow';

/** 대시보드 상단 — 매일 사용 순서 */
export function StaffDailyFlow() {
  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            이렇게 쓰세요
          </p>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            매일 ① 기록 → ② 대시보드 → ③ 필요 시 상담
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            모든 메뉴를 볼 필요 없습니다. 아래 순서만 따라가면 됩니다.
          </p>
        </div>
      </div>
      <ol className="grid sm:grid-cols-3 gap-3">
        {STAFF_DAILY_FLOW.map((item) => (
          <li key={item.step}>
            <Link
              href={item.href}
              className="flex h-full gap-3 p-4 rounded-xl border border-white bg-white/80 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {item.step}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <i className={`${item.icon} text-indigo-600`} aria-hidden />
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
