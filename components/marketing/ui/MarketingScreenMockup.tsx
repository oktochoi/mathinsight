'use client';

import { cn } from '@/lib/cn';
import { COMPANY_DOMAIN } from '@/lib/brand';

export type MarketingScreenVariant =
  | 'dashboard'
  | 'today-lesson'
  | 'student-hub'
  | 'parent-report'
  | 'student-portal'
  | 'billing';

const APP_DOMAIN = `www.${COMPANY_DOMAIN}`;

function Chrome({ children, path = '' }: { children: React.ReactNode; path?: string }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-black/[0.03]">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-slate-50/70 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <div className="mx-1 flex h-5 flex-1 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[10px] text-slate-400">
          <i className="ri-lock-line mr-1 text-slate-300" />
          {APP_DOMAIN}
          {path}
        </div>
      </div>
      {children}
    </div>
  );
}

/** 이름에서 딴 이니셜 + 부드러운 그라디언트 — 실제 아바타 사진 없이도 친근하게 */
function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 font-bold text-white ring-2 ring-white',
        className
      )}
    >
      {name.slice(0, 1)}
    </div>
  );
}

/** 점수 추이 미니 스파크라인 — "AI가 그냥 넘겨짚은 게 아니라 실제 하락 추세를 봤다"를 시각적으로 증명 */
function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 88;
  const h = 30;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`).join(' ');
  const last = points[points.length - 1];
  const lastX = w;
  const lastY = h - ((last - min) / range) * h;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} fill="none">
      <polyline points={coords} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="currentColor" />
    </svg>
  );
}

function DashboardMockup() {
  return (
    <Chrome>
      <div className="bg-slate-50 p-3.5 min-h-[300px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">오늘 운영</p>
            <p className="text-[10px] text-slate-400">5월 22일 · 데모 수학학원</p>
          </div>
          <span className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">원장</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {['상담 2건', '위험 3명', '미마감 1반'].map((t, i) => (
            <span
              key={t}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                i === 1 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3 space-y-2">
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold text-slate-500">오늘 할 일</p>
              {['14:00 중2-A 상담', '미제출 숙제 4건', '수업 마감 · 중3-B'].map((t) => (
                <div key={t} className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-700">
                  <span className="h-3.5 w-3.5 rounded border border-slate-200" />
                  {t}
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold text-slate-500">오늘 수업</p>
              <div className="mt-1.5 space-y-1">
                {['중2-A 16:00', '중3-B 18:00'].map((t) => (
                  <div key={t} className="flex justify-between rounded-lg bg-slate-50 px-2 py-1 text-[10px]">
                    <span>{t}</span>
                    <span className="text-emerald-600">진행</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-2 space-y-2">
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-2.5">
              <p className="text-[10px] font-bold text-orange-800">재등록</p>
              <p className="mt-1 text-lg font-extrabold text-orange-900">2</p>
              <p className="text-[9px] text-orange-700">주의 필요</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold text-slate-500">미납</p>
              <p className="mt-1 text-lg font-extrabold text-slate-800">₩840k</p>
            </div>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

function TodayLessonMockup() {
  const rows = [
    { name: '김민준', att: '출석' },
    { name: '이서연', att: '지각' },
    { name: '박지호', att: '출석' },
    { name: '최유나', att: '결석' },
  ];
  return (
    <Chrome path="/schedule">
      <div className="bg-white p-3.5 min-h-[300px]">
        <p className="text-sm font-bold text-slate-800">중2-A · 수업 입력</p>
        <p className="text-[10px] text-slate-400">16:00 · 오늘</p>
        <div className="mt-3 flex gap-1">
          {['출결', '숙제', '점수', '메모'].map((t, i) => (
            <span
              key={t}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold',
                i === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-400">
            <span>학생</span>
            <span>출결</span>
            <span>숙제</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.name}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-slate-100 px-2.5 py-2"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-800">
                <Avatar name={r.name} className="h-5 w-5 text-[9px]" />
                {r.name}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-bold',
                  r.att === '출석' && 'bg-emerald-100 text-emerald-700',
                  r.att === '지각' && 'bg-amber-100 text-amber-700',
                  r.att === '결석' && 'bg-rose-100 text-rose-700'
                )}
              >
                {r.att}
              </span>
              <span className="h-5 w-8 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50 px-2.5 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold text-violet-700">
            <i className="ri-sparkling-2-fill" />
            AI가 김민준 학생의 반복 오답 패턴을 감지했어요
          </p>
          <span className="flex-none rounded-full bg-violet-600 px-2 py-0.5 text-[8px] font-bold text-white">NEW</span>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white">수업 마감</span>
        </div>
      </div>
    </Chrome>
  );
}

function StudentHubMockup() {
  return (
    <Chrome path="/students">
      <div className="flex min-h-[300px]">
        <div className="flex-1 border-r border-slate-100 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center gap-2">
            <Avatar name="김민준" className="h-9 w-9 text-sm" />
            <div>
              <p className="text-sm font-bold text-slate-800">김민준</p>
              <p className="text-[10px] text-slate-400">중2-A · 92점</p>
            </div>
            <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
              주의
            </span>
          </div>
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
            <div>
              <p className="text-[9px] font-bold text-slate-500">최근 4회 시험 점수</p>
              <p className="mt-0.5 text-[9px] text-rose-600">95 → 92 → 90 → 88 → 76</p>
            </div>
            <Sparkline points={[95, 92, 90, 88, 76]} className="ml-auto flex-none text-rose-500" />
          </div>
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-2.5 mb-3 shadow-sm shadow-violet-900/5">
            <p className="flex items-center gap-1 text-[9px] font-bold text-violet-700">
              <i className="ri-sparkling-2-fill" /> AI 브리핑
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-violet-900">
              4주째 성적이 흔들리고 있어요 · 숙제도 같이 밀리는 중 · 오늘 상담에서 동기부여가 필요해 보여요
            </p>
          </div>
          <div className="space-y-2">
            {['5/20 수업 · 출석', '5/18 시험 88→76', '5/15 상담 완료'].map((t) => (
              <div key={t} className="flex gap-2 text-[10px] text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-teal-400" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <aside className="w-[38%] bg-white p-2.5">
          <p className="text-[9px] font-bold text-slate-400">상담 센터</p>
          <div className="mt-2 rounded-lg border border-slate-200 p-2">
            <p className="text-[10px] font-semibold text-slate-700">다음 상담</p>
            <p className="text-[9px] text-slate-400">5/25 14:00</p>
          </div>
          <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
            <p className="text-[9px] font-bold text-emerald-700">재등록</p>
            <p className="text-[10px] text-emerald-900">위험도 중</p>
          </div>
        </aside>
      </div>
    </Chrome>
  );
}

function ParentReportMockup() {
  return (
    <div className="relative mx-auto max-w-[280px] py-2">
      <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-slate-800 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-1.5 text-[9px] text-white">
          <span>9:41</span>
          <span className="font-semibold">학부모</span>
          <span>100%</span>
        </div>
        <div className="bg-slate-50 px-3 pb-14 pt-3 min-h-[280px]">
          <p className="text-xs font-bold text-slate-800">오늘 확인할 것 👋</p>
          <div className="mt-2 space-y-2">
            <div className="rounded-xl border border-teal-100 bg-teal-50 p-2.5">
              <p className="text-[10px] font-bold text-teal-800">새 리포트</p>
              <p className="text-[9px] text-teal-600">5월 학습 요약 도착</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold text-slate-700">미제출 숙제 1건</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-violet-100 bg-white p-2.5">
            <p className="text-[9px] font-bold text-violet-700">
              <i className="ri-sparkling-2-fill mr-0.5" />
              AI 도우미
            </p>
            <p className="mt-1 text-[9px] text-slate-500">민준이 이번 주 숙제는?</p>
            <div className="mt-1.5 rounded-lg bg-violet-50 px-2 py-1 text-[9px] text-violet-800">
              RAG · 학원 기록 기반 답변
            </div>
          </div>
        </div>
        <div className="flex border-t border-slate-200 bg-white px-2 py-2">
          {[
            { t: '홈', icon: 'ri-home-5-fill' },
            { t: '학습', icon: 'ri-book-open-line' },
            { t: '일정', icon: 'ri-calendar-line' },
            { t: '더보기', icon: 'ri-more-fill' },
          ].map((n, i) => (
            <div key={n.t} className="flex flex-1 flex-col items-center gap-0.5">
              <i className={cn(n.icon, 'text-sm', i === 0 ? 'text-emerald-600' : 'text-slate-300')} />
              <span className={cn('text-[8px]', i === 0 ? 'font-bold text-emerald-600' : 'text-slate-400')}>
                {n.t}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute" />
      </div>
    </div>
  );
}

function StudentPortalMockup() {
  return (
    <div className="relative mx-auto max-w-[280px] py-2">
      <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-slate-800 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-1.5 text-[9px] text-white">
          <span>9:41</span>
          <span className="font-semibold">민준</span>
          <span>100%</span>
        </div>
        <div className="bg-slate-50 px-3 pb-14 pt-3 min-h-[280px]">
          <p className="text-xs font-bold text-slate-800">오늘 숙제 🔥</p>
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
            <p className="text-[10px] font-bold text-emerald-800">이차방정식 10문제</p>
            <p className="text-[9px] text-emerald-600">18:00까지 제출</p>
          </div>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5">
            <p className="text-[10px] font-bold text-slate-700">이번 주 출석 4/5</p>
          </div>
          <div className="mt-3 rounded-xl border border-violet-100 bg-white p-2.5">
            <p className="text-[9px] font-bold text-violet-700">
              <i className="ri-sparkling-2-fill mr-0.5" />
              AI에게 물어보기
            </p>
            <p className="mt-1 text-[9px] text-slate-500">이 문제 어떻게 풀어?</p>
          </div>
        </div>
        <div className="flex border-t border-slate-200 bg-white px-2 py-2">
          {[
            { t: '홈', icon: 'ri-home-5-fill' },
            { t: '숙제', icon: 'ri-book-open-line' },
            { t: '성적', icon: 'ri-line-chart-line' },
            { t: '더보기', icon: 'ri-more-fill' },
          ].map((n, i) => (
            <div key={n.t} className="flex flex-1 flex-col items-center gap-0.5">
              <i className={cn(n.icon, 'text-sm', i === 0 ? 'text-emerald-600' : 'text-slate-300')} />
              <span className={cn('text-[8px]', i === 0 ? 'font-bold text-emerald-600' : 'text-slate-400')}>
                {n.t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingMockup() {
  const rows = [
    { name: '김민준', amt: '₩320,000', st: '미납' },
    { name: '이서연', amt: '₩280,000', st: '연체' },
    { name: '박지호', amt: '₩320,000', st: '완납' },
  ];
  return (
    <Chrome path="/billing">
      <div className="bg-white p-3.5 min-h-[300px]">
        <p className="text-sm font-bold text-slate-800">수납 · 재등록</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {['미납', '연체', '재등록+미납', '완납'].map((t, i) => (
            <span
              key={t}
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-semibold',
                i === 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { l: '미납', v: '12' },
            { l: '연체', v: '3' },
            { l: '이번 달', v: '₩4.2M' },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-slate-200 p-2 text-center">
              <p className="text-[9px] text-slate-400">{s.l}</p>
              <p className="text-sm font-extrabold text-slate-800">{s.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between border-t border-slate-100 px-2.5 py-2 first:border-0"
            >
              <span className="text-[11px] font-medium text-slate-800">{r.name}</span>
              <span className="text-[10px] text-slate-500">{r.amt}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-bold',
                  r.st === '완납' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}
              >
                {r.st}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}

const MOCKUPS: Record<MarketingScreenVariant, () => React.ReactNode> = {
  dashboard: DashboardMockup,
  'today-lesson': TodayLessonMockup,
  'student-hub': StudentHubMockup,
  'parent-report': ParentReportMockup,
  'student-portal': StudentPortalMockup,
  billing: BillingMockup,
};

export function MarketingScreenMockup({
  variant,
  className,
}: {
  variant: MarketingScreenVariant;
  className?: string;
}) {
  const Mock = MOCKUPS[variant] ?? DashboardMockup;
  return (
    <div className={className}>
      <Mock />
    </div>
  );
}
