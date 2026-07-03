'use client';

import { cn } from '@/lib/cn';

export type MarketingScreenVariant =
  | 'dashboard'
  | 'today-lesson'
  | 'student-hub'
  | 'parent-report'
  | 'billing';

function Chrome({ children, url = 'app.eduflow.kr' }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        <div className="mx-1 flex h-5 flex-1 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[10px] text-slate-400">
          <i className="ri-lock-line mr-1 text-slate-300" />
          {url}
        </div>
      </div>
      {children}
    </div>
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
          <span className="rounded-lg bg-sky-600 px-2 py-1 text-[10px] font-bold text-white">원장</span>
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
    <Chrome url="app.eduflow.kr/schedule">
      <div className="bg-white p-3.5 min-h-[300px]">
        <p className="text-sm font-bold text-slate-800">중2-A · 수업 입력</p>
        <p className="text-[10px] text-slate-400">16:00 · 오늘</p>
        <div className="mt-3 flex gap-1">
          {['출결', '숙제', '점수', '메모'].map((t, i) => (
            <span
              key={t}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold',
                i === 0 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
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
              <span className="text-[11px] font-medium text-slate-800">{r.name}</span>
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
        <div className="mt-3 flex justify-end">
          <span className="rounded-lg bg-sky-600 px-3 py-1.5 text-[10px] font-bold text-white">수업 마감</span>
        </div>
      </div>
    </Chrome>
  );
}

function StudentHubMockup() {
  return (
    <Chrome url="app.eduflow.kr/students">
      <div className="flex min-h-[300px]">
        <div className="flex-1 border-r border-slate-100 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600" />
            <div>
              <p className="text-sm font-bold text-slate-800">김민준</p>
              <p className="text-[10px] text-slate-400">중2-A · 92점</p>
            </div>
            <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
              주의
            </span>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-2.5 mb-3">
            <p className="text-[9px] font-bold text-violet-700">AI 브리핑</p>
            <p className="mt-1 text-[10px] leading-relaxed text-violet-900">
              최근 숙제 제출률 하락 · 상담 시 동기 부여 권장
            </p>
          </div>
          <div className="space-y-2">
            {['5/20 수업 · 출석', '5/18 시험 88→76', '5/15 상담 완료'].map((t) => (
              <div key={t} className="flex gap-2 text-[10px] text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-sky-400" />
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
          <p className="text-xs font-bold text-slate-800">오늘 확인할 것</p>
          <div className="mt-2 space-y-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5">
              <p className="text-[10px] font-bold text-indigo-800">새 리포트</p>
              <p className="text-[9px] text-indigo-600">5월 학습 요약 도착</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold text-slate-700">미제출 숙제 1건</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-sky-100 bg-white p-2.5">
            <p className="text-[9px] font-bold text-sky-700">AI 도우미</p>
            <p className="mt-1 text-[9px] text-slate-500">민준이 이번 주 숙제는?</p>
            <div className="mt-1.5 rounded-lg bg-sky-50 px-2 py-1 text-[9px] text-sky-800">
              RAG · 학원 기록 기반 답변
            </div>
          </div>
        </div>
        <div className="flex border-t border-slate-200 bg-white px-2 py-2">
          {['홈', '학습', '일정', '더보기'].map((t, i) => (
            <div key={t} className="flex flex-1 flex-col items-center gap-0.5">
              <span
                className={cn(
                  'h-4 w-4 rounded',
                  i === 0 ? 'bg-sky-500' : 'bg-slate-200'
                )}
              />
              <span className={cn('text-[8px]', i === 0 ? 'text-sky-600 font-bold' : 'text-slate-400')}>
                {t}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute" />
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
    <Chrome url="app.eduflow.kr/billing">
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
