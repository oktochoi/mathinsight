import { cn } from '@/lib/cn';

/**
 * 히어로 풀블리드 운영 표면 — 잘려 나가는 ERP 화면.
 * 밀도·정렬·상태 색으로 "실제 매일 여는 화면"처럼 보이게 한다.
 */

const NAV = [
  { icon: 'ri-sun-line', label: '오늘', meta: '6', active: true },
  { icon: 'ri-group-line', label: '학생', meta: '148', active: false },
  { icon: 'ri-calendar-check-line', label: '수업', meta: '12', active: false },
  { icon: 'ri-chat-3-line', label: '상담', meta: '2', active: false },
  { icon: 'ri-refresh-line', label: '재등록', meta: '3', active: false },
] as const;

const LESSONS = [
  { time: '16:00', klass: '중2-A', teacher: '김선생', state: '진행 중', live: true },
  { time: '18:00', klass: '중3-B', teacher: '박선생', state: '예정', live: false },
  { time: '20:00', klass: '고1-A', teacher: '김선생', state: '예정', live: false },
] as const;

const CHECKS = [
  { label: '수업 마감 대기', value: '1반', warn: true },
  { label: '미제출 숙제', value: '4건', warn: true },
  { label: '오늘 상담', value: '2건', warn: false },
] as const;

const RISKS = [
  { name: '김민준', klass: '중2-A', reason: '최근 4회 점수 하락', high: true },
  { name: '이서연', klass: '중3-B', reason: '숙제 2회 미제출', high: false },
  { name: '박지호', klass: '고1-A', reason: '상담 후 변화 없음', high: false },
] as const;

export function HomeHeroConsole() {
  return (
    <div aria-hidden className="w-full border-t border-slate-200/90 bg-white shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.12)]">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16">
        <div className="flex items-center gap-3 border-b border-slate-100 py-3.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white shadow-sm shadow-emerald-600/30">
            E
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-800">데모 수학학원</span>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">원장 · 오늘</span>
          <span className="ml-auto hidden items-center gap-2 sm:flex">
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              위험 3
            </span>
            <span className="text-xs tabular-nums text-slate-400">2026. 5. 22. 수</span>
          </span>
        </div>

        <div className="grid lg:grid-cols-[200px_1fr_280px]">
          <nav className="hidden py-5 pr-6 lg:block">
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              메뉴
            </p>
            {NAV.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]',
                  item.active
                    ? 'bg-emerald-50 font-semibold text-emerald-800 shadow-sm shadow-emerald-900/5'
                    : 'text-slate-600'
                )}
              >
                <i className={cn(item.icon, 'text-base', item.active ? 'text-emerald-600' : 'text-slate-400')} />
                {item.label}
                {item.meta && (
                  <span className="ml-auto text-[11px] tabular-nums text-slate-400">{item.meta}</span>
                )}
              </div>
            ))}
          </nav>

          <div className="border-slate-100 py-5 lg:border-x lg:px-8">
            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">오늘</h3>
              <p className="text-xs text-slate-400">수업 3 · 상담 2 · 마감 대기 1</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.03]">
              <div className="grid grid-cols-[58px_1fr_72px_64px] gap-2 border-b border-slate-100 bg-slate-50/90 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>시간</span>
                <span>반</span>
                <span>담당</span>
                <span className="text-right">상태</span>
              </div>
              {LESSONS.map((lesson) => (
                <div
                  key={lesson.time}
                  className="grid grid-cols-[58px_1fr_72px_64px] items-center gap-2 border-b border-slate-100 px-3.5 py-3 text-[13px] last:border-0"
                >
                  <span className="tabular-nums text-slate-500">{lesson.time}</span>
                  <span className="font-semibold text-slate-800">{lesson.klass}</span>
                  <span className="text-slate-500">{lesson.teacher}</span>
                  <span
                    className={cn(
                      'text-right text-[11px] font-semibold',
                      lesson.live ? 'text-emerald-700' : 'text-slate-400'
                    )}
                  >
                    {lesson.live && (
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {lesson.state}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              확인 필요
            </p>
            <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
              {CHECKS.map((check) => (
                <div key={check.label} className="flex items-center gap-3 px-3.5 py-3 text-[13px]">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      check.warn ? 'bg-amber-400' : 'bg-slate-300'
                    )}
                  />
                  <span className="text-slate-600">{check.label}</span>
                  <span className="ml-auto tabular-nums font-semibold text-slate-800">{check.value}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden py-5 pl-6 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              재등록 주의
            </p>
            <div className="mt-2.5 space-y-2">
              {RISKS.map((risk) => (
                <div
                  key={risk.name}
                  className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm shadow-slate-900/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        risk.high ? 'bg-rose-400' : 'bg-amber-400'
                      )}
                    />
                    <span className="text-[13px] font-semibold text-slate-800">{risk.name}</span>
                    <span className="ml-auto text-[11px] text-slate-400">{risk.klass}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{risk.reason}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-3 py-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
                <i className="ri-sparkling-2-line" />
                상담 전 요약
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                14:00 상담 · 김민준 — 이차방정식 반복 오답, 숙제 2회 미제출
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
