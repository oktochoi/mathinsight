'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { SCREENSHOTS, type ScreenshotKey } from '@/lib/marketing/screenshots';

/* ─── 키별 색상·내용 설정 ─────────────────────────────────────── */
const MOCKUP_THEMES: Record<string, { accent: string; title: string; stats: { v: string; l: string }[] }> = {
  dashboard:      { accent: 'from-sky-500 to-blue-600',    title: '대시보드',        stats: [{ v: '8', l: '오늘 수업' }, { v: '3', l: '상담 예정' }, { v: '2', l: '위험 학생' }] },
  'today-lesson': { accent: 'from-violet-500 to-purple-600', title: 'Today Workspace', stats: [{ v: '14', l: '출석' }, { v: '2', l: '결석' }, { v: '9', l: '숙제 완료' }] },
  'student-hub':  { accent: 'from-emerald-500 to-teal-600', title: 'Student Hub',      stats: [{ v: '92', l: '평균 점수' }, { v: '88%', l: '출석률' }, { v: '5', l: '누적 상담' }] },
  'parent-report':{ accent: 'from-orange-500 to-rose-600',  title: 'Parent Report',    stats: [{ v: '12', l: '리포트 전송' }, { v: '98%', l: '열람률' }, { v: '4', l: '미전송' }] },
};

function AppMockup({ screenshotKey }: { screenshotKey?: ScreenshotKey }) {
  const theme = MOCKUP_THEMES[screenshotKey ?? 'dashboard'] ?? MOCKUP_THEMES.dashboard;
  const chartBars = [55, 72, 45, 88, 62, 95, 70];
  const navIcons = ['ri-home-4-line', 'ri-calendar-line', 'ri-group-line', 'ri-bar-chart-2-line', 'ri-chat-3-line', 'ri-settings-3-line'];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
        <div className="mx-2 flex h-6 flex-1 items-center rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-400">
          <i className="ri-lock-line mr-1 text-slate-300" />
          app.eduflow.kr
        </div>
        <div className="flex gap-1">
          <span className="h-6 w-6 rounded bg-slate-100" />
          <span className="h-6 w-6 rounded bg-slate-100" />
        </div>
      </div>

      {/* App layout */}
      <div className="flex h-[320px] overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-14 flex-none flex-col items-center gap-1.5 border-r border-slate-100 bg-slate-50 py-3">
          <div className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${theme.accent} shadow-sm`}>
            <i className="ri-flow-chart text-sm text-white" />
          </div>
          {navIcons.map((icon, i) => (
            <div
              key={icon}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all',
                i === 0 ? 'bg-white shadow-sm text-sky-700' : 'text-slate-400 hover:bg-white'
              )}
            >
              <i className={icon} />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 p-4">
          {/* Page header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="h-4 w-20 rounded bg-slate-800/10 mb-1" />
              <div className="h-2.5 w-28 rounded bg-slate-400/20" />
            </div>
            <div className={`rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-[10px] font-bold text-white shadow-sm`}>
              {theme.title}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {theme.stats.map((s) => (
              <div key={s.l} className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                <p className="text-base font-extrabold text-slate-800">{s.v}</p>
                <p className="text-[10px] text-slate-400">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-2.5 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-2.5 w-14 rounded bg-slate-100" />
              <div className="h-2 w-10 rounded bg-slate-50" />
            </div>
            <div className="flex h-14 items-end gap-1">
              {chartBars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t bg-gradient-to-t ${theme.accent} opacity-80`}
                />
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
                <div className={`h-6 w-6 flex-none rounded-full bg-gradient-to-br ${theme.accent} opacity-80`} />
                <div className="flex-1 space-y-1">
                  <div className={`h-2 rounded bg-slate-100`} style={{ width: `${70 - i * 12}%` }} />
                  <div className="h-1.5 w-12 rounded bg-slate-50" />
                </div>
                <div className="h-4 w-10 rounded-full bg-emerald-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 공개 컴포넌트 ───────────────────────────────────────────── */
type Props = {
  screenshotKey?: ScreenshotKey;
  label?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function ScreenshotPlaceholder({
  screenshotKey,
  label,
  src,
  alt,
  width,
  height,
  className,
  priority,
}: Props) {
  const spec = screenshotKey ? SCREENSHOTS[screenshotKey] : undefined;
  const resolvedSrc = src ?? spec?.src;
  const w = width ?? spec?.width ?? 1280;
  const h = height ?? spec?.height ?? 720;

  if (resolvedSrc) {
    return (
      <div
        className={cn('relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100', className)}
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <Image
          src={resolvedSrc}
          alt={alt ?? label ?? 'Product screenshot'}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          priority={priority}
          loading={priority ? undefined : 'lazy'}
        />
      </div>
    );
  }

  return <div className={className}><AppMockup screenshotKey={screenshotKey} /></div>;
}
