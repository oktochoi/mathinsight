'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

type LegendItem = { label: string; desc: string };

export function PageGuide({
  title = '이 화면에서 하는 일',
  tasks,
  legend,
  defaultOpen = false,
}: {
  title?: string;
  tasks: string[];
  legend?: LegendItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <i className="ri-question-line text-indigo-500" />
          {title}
        </span>
        <i
          className={cn(
            'ri-arrow-down-s-line text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-100">
          <ol className="text-sm text-slate-600 list-decimal list-inside space-y-1.5 leading-relaxed">
            {tasks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
          {legend && legend.length > 0 && (
            <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500">용어 설명</p>
              <dl className="space-y-2">
                {legend.map((item) => (
                  <div key={item.label} className="text-xs">
                    <dt className="font-semibold text-slate-800">{item.label}</dt>
                    <dd className="text-slate-500 mt-0.5">{item.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
