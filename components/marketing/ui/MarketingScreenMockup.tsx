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

const APP_DOMAIN = `app.${COMPANY_DOMAIN}`;

/** 브라우저 크롬 — 제품 사진을 대신하는 신뢰형 프레임 */
function Chrome({
  children,
  path = '/today',
  className,
}: {
  children: React.ReactNode;
  path?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.04]',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f6f7f9] px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 flex h-6 flex-1 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 text-[10px] text-slate-400 shadow-sm">
          <i className="ri-lock-fill text-[10px] text-emerald-600/70" />
          <span className="truncate font-medium text-slate-500">
            {APP_DOMAIN}
            {path}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

function Avatar({
  name,
  tone = 'emerald',
  size = 'md',
}: {
  name: string;
  tone?: 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
  size?: 'sm' | 'md' | 'lg';
}) {
  const tones = {
    emerald: 'from-emerald-400 to-teal-600',
    sky: 'from-sky-400 to-blue-600',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-400 to-pink-600',
    violet: 'from-violet-400 to-indigo-600',
  };
  const sizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };
  return (
    <div
      className={cn(
        'flex flex-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm ring-2 ring-white',
        tones[tone],
        sizes[size]
      )}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * (h - 4) - 2}`)
    .join(' ');
  const last = points[points.length - 1];
  const lastX = w;
  const lastY = h - ((last - min) / range) * (h - 4) - 2;
  const area = `0,${h} ${coords} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} fill="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline
        points={coords}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="currentColor" />
    </svg>
  );
}

function SideNav({ active }: { active: string }) {
  const items = [
    { id: 'today', icon: 'ri-sun-line', label: '오늘' },
    { id: 'students', icon: 'ri-group-line', label: '학생' },
    { id: 'schedule', icon: 'ri-calendar-check-line', label: '수업' },
    { id: 'counsel', icon: 'ri-chat-3-line', label: '상담' },
    { id: 'billing', icon: 'ri-receipt-line', label: '수납' },
  ];
  return (
    <aside className="hidden w-[72px] flex-col border-r border-slate-100 bg-[#fbfbfc] py-3 sm:flex">
      <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm shadow-emerald-600/30">
        E
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-1 py-2',
              item.id === active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
            )}
          >
            <i className={cn(item.icon, 'text-base')} />
            <span className="text-[8px] font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function DashboardMockup() {
  return (
    <Chrome path="/today">
      <div className="flex min-h-[340px] bg-[#f4f5f7]">
        <SideNav active="today" />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3">
            <div>
              <p className="text-[13px] font-bold tracking-tight text-slate-900">오늘</p>
              <p className="text-[10px] text-slate-400">5월 22일 수 · 데모 수학학원</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:inline">
                상담 2
              </span>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                위험 3
              </span>
              <Avatar name="원" size="sm" />
            </div>
          </header>

          <div className="grid flex-1 gap-3 p-3 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-800">오늘 할 일</p>
                  <span className="text-[10px] text-slate-400">3건</span>
                </div>
                {[
                  { t: '14:00 김민준 상담', tag: '상담', tone: 'emerald' },
                  { t: '미제출 숙제 4건 확인', tag: '숙제', tone: 'amber' },
                  { t: '중3-B 수업 마감', tag: '마감', tone: 'slate' },
                ].map((row) => (
                  <div
                    key={row.t}
                    className="flex items-center gap-2.5 border-t border-slate-100 py-2 first:border-0 first:pt-0"
                  >
                    <span className="h-4 w-4 rounded border border-slate-200 bg-slate-50" />
                    <span className="flex-1 text-[11px] font-medium text-slate-700">{row.t}</span>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[9px] font-bold',
                        row.tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
                        row.tone === 'amber' && 'bg-amber-50 text-amber-700',
                        row.tone === 'slate' && 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {row.tag}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/[0.03]">
                <p className="mb-2 text-[11px] font-bold text-slate-800">오늘 수업</p>
                {[
                  { time: '16:00', klass: '중2-A', state: '진행 중', live: true },
                  { time: '18:00', klass: '중3-B', state: '예정', live: false },
                  { time: '20:00', klass: '고1-A', state: '예정', live: false },
                ].map((lesson) => (
                  <div
                    key={lesson.time}
                    className="mb-1.5 flex items-center gap-3 rounded-lg bg-slate-50/80 px-2.5 py-2 last:mb-0"
                  >
                    <span className="w-10 text-[11px] font-semibold tabular-nums text-slate-500">
                      {lesson.time}
                    </span>
                    <span className="flex-1 text-[11px] font-bold text-slate-800">{lesson.klass}</span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold',
                        lesson.live ? 'text-emerald-600' : 'text-slate-400'
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
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">재등록 주의</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-rose-900">3</p>
                <p className="text-[10px] text-rose-700/80">결제 전 신호 감지</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                <p className="mb-2 text-[11px] font-bold text-slate-800">위험 학생</p>
                {[
                  { name: '김민준', reason: '점수 4회 하락', high: true },
                  { name: '이서연', reason: '숙제 2회 미제출', high: false },
                ].map((s) => (
                  <div key={s.name} className="mb-2 flex items-start gap-2 last:mb-0">
                    <Avatar name={s.name} tone={s.high ? 'rose' : 'amber'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-800">{s.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{s.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold text-violet-700">
                  <i className="ri-sparkling-2-fill" /> 상담 전 요약
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-violet-900/90">
                  14:00 김민준 — 이차방정식 반복 오답, 숙제 2회 미제출
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

function TodayLessonMockup() {
  const rows = [
    { name: '김민준', att: '출석', hw: true, tone: 'emerald' as const },
    { name: '이서연', att: '지각', hw: false, tone: 'sky' as const },
    { name: '박지호', att: '출석', hw: true, tone: 'amber' as const },
    { name: '최유나', att: '결석', hw: false, tone: 'rose' as const },
    { name: '정하은', att: '출석', hw: true, tone: 'violet' as const },
  ];
  return (
    <Chrome path="/schedule/today">
      <div className="flex min-h-[340px] bg-[#f4f5f7]">
        <SideNav active="schedule" />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-900">중2-A · 수업 입력</p>
              <p className="text-[10px] text-slate-400">오늘 16:00 · 김선생 · 학생 12명</p>
            </div>
            <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm shadow-emerald-600/25">
              수업 마감
            </span>
          </div>

          <div className="mb-3 flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200/80">
            {['출결', '숙제', '점수', '메모'].map((t, i) => (
              <span
                key={t}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-center text-[10px] font-semibold',
                  i === 0 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                )}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_64px_56px] gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span>학생</span>
              <span className="text-center">출결</span>
              <span className="text-center">숙제</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[1fr_64px_56px] items-center gap-2 border-b border-slate-50 px-3 py-2.5 last:border-0"
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <Avatar name={r.name} tone={r.tone} size="sm" />
                  {r.name}
                </span>
                <span
                  className={cn(
                    'justify-self-center rounded-full px-2 py-0.5 text-[9px] font-bold',
                    r.att === '출석' && 'bg-emerald-50 text-emerald-700',
                    r.att === '지각' && 'bg-amber-50 text-amber-700',
                    r.att === '결석' && 'bg-rose-50 text-rose-700'
                  )}
                >
                  {r.att}
                </span>
                <span className="justify-self-center">
                  {r.hw ? (
                    <i className="ri-checkbox-circle-fill text-base text-emerald-500" />
                  ) : (
                    <i className="ri-close-circle-fill text-base text-rose-400" />
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white px-3 py-2.5">
            <i className="ri-sparkling-2-fill mt-0.5 text-sm text-violet-600" />
            <div>
              <p className="text-[10px] font-bold text-violet-800">기록에서 감지된 신호</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-violet-700/90">
                김민준 · 이차방정식 반복 오답 · 숙제 미제출 2회
              </p>
            </div>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

function StudentHubMockup() {
  return (
    <Chrome path="/students/minjun">
      <div className="flex min-h-[340px] bg-[#f4f5f7]">
        <SideNav active="students" />
        <div className="flex min-w-0 flex-1">
          <div className="min-w-0 flex-1 border-r border-slate-100 bg-white p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name="김민준" tone="rose" size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900">김민준</p>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                    주의
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">중2-A · 학부모 김○○ · 재등록 D-18</p>
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">최근 시험</p>
                  <p className="mt-1 text-[12px] font-bold tabular-nums text-rose-600">
                    95 → 92 → 88 → 76
                  </p>
                </div>
                <Sparkline points={[95, 92, 90, 88, 76]} className="text-rose-500" />
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold text-violet-700">
                <i className="ri-sparkling-2-fill" /> 상담 브리핑
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-700">
                4주째 성적이 흔들리고, 숙제도 같이 밀리고 있어요. 오늘 상담에서 동기와 학습 루틴을
                먼저 확인해 주세요.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['시험 88→76', '숙제 미제출 2', '상담 5/15'].map((g) => (
                  <span
                    key={g}
                    className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { d: '5/20', t: '수업 · 출석 · 숙제 미제출' },
                { d: '5/18', t: '시험 76점 · 이차방정식' },
                { d: '5/15', t: '상담 완료 · 학부모 전달' },
              ].map((row) => (
                <div key={row.d} className="flex gap-3 text-[11px]">
                  <span className="w-8 flex-none tabular-nums text-slate-400">{row.d}</span>
                  <span className="text-slate-700">{row.t}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden w-[38%] bg-[#fbfbfc] p-3.5 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">상담 센터</p>
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-bold text-slate-800">다음 상담</p>
              <p className="mt-1 text-[12px] font-semibold text-emerald-700">5/25 14:00</p>
              <p className="mt-1 text-[10px] text-slate-400">학부모 동석 · 30분</p>
            </div>
            <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-[10px] font-bold text-emerald-700">재등록</p>
              <p className="mt-1 text-[12px] font-bold text-emerald-900">위험도 중</p>
              <p className="mt-1 text-[10px] text-emerald-700/80">결제일 18일 전</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {['이차방정식 막히는 지점', '숙제 루틴', '지난 상담 이후'].map((t, i) => (
                <div
                  key={t}
                  className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-[10px] text-slate-600 ring-1 ring-slate-100"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Chrome>
  );
}

function PhoneShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="overflow-hidden rounded-[2rem] border-[7px] border-slate-900 bg-white shadow-[0_28px_60px_-20px_rgba(15,23,42,0.45)]">
        <div className="relative bg-slate-900 px-5 pb-2 pt-3">
          <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black/40" />
          <div className="flex items-center justify-between text-[10px] font-medium text-white/90">
            <span>9:41</span>
            <span className="font-semibold">{title}</span>
            <span className="flex items-center gap-0.5">
              <i className="ri-signal-wifi-fill text-[10px]" />
              <i className="ri-battery-fill text-[11px]" />
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ParentReportMockup() {
  return (
    <PhoneShell title="학부모">
      <div className="min-h-[300px] bg-[#f3f5f4] px-3 pb-3 pt-3">
        <p className="text-[13px] font-bold text-slate-900">민준이 이번 주</p>
        <p className="mt-0.5 text-[10px] text-slate-400">데모 수학학원 · 중2-A</p>

        <div className="mt-3 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-3 shadow-sm">
          <p className="text-[10px] font-bold text-teal-800">새 학습 리포트</p>
          <p className="mt-1 text-[11px] leading-relaxed text-teal-900/90">
            출석 4/5 · 숙제 3/5 · 시험 76점
          </p>
          <p className="mt-2 text-[10px] font-semibold text-teal-700">자세히 보기 →</p>
        </div>

        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-800">미제출 숙제</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
              1건
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">이차방정식 연습 10문제</p>
        </div>

        <div className="mt-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
          <p className="flex items-center gap-1 text-[10px] font-bold text-violet-700">
            <i className="ri-sparkling-2-fill" /> 학원 기록 기반 답변
          </p>
          <p className="mt-1.5 rounded-xl bg-violet-50 px-2.5 py-2 text-[10px] leading-relaxed text-violet-900">
            민준이는 이차방정식에서 반복해서 막히고 있어요. 지난 상담(5/15) 이후 숙제도 두 번
            밀렸습니다.
          </p>
        </div>
      </div>
      <div className="flex border-t border-slate-100 bg-white px-1 py-2">
        {[
          { t: '홈', icon: 'ri-home-5-fill', on: true },
          { t: '학습', icon: 'ri-book-open-line', on: false },
          { t: '일정', icon: 'ri-calendar-line', on: false },
          { t: '더보기', icon: 'ri-more-fill', on: false },
        ].map((n) => (
          <div key={n.t} className="flex flex-1 flex-col items-center gap-0.5">
            <i className={cn(n.icon, 'text-sm', n.on ? 'text-emerald-600' : 'text-slate-300')} />
            <span className={cn('text-[8px]', n.on ? 'font-bold text-emerald-600' : 'text-slate-400')}>
              {n.t}
            </span>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}

function StudentPortalMockup() {
  return (
    <PhoneShell title="민준">
      <div className="min-h-[300px] bg-[#f3f5f4] px-3 pb-3 pt-3">
        <p className="text-[13px] font-bold text-slate-900">오늘 할 일</p>
        <p className="mt-0.5 text-[10px] text-slate-400">5월 22일 · 중2-A</p>

        <div className="mt-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-900">이차방정식 10문제</p>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
              숙제
            </span>
          </div>
          <p className="mt-1 text-[10px] text-emerald-700">오늘 18:00까지</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-1/3 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400">이번 주 출석</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">4/5</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400">최근 시험</p>
            <p className="mt-1 text-lg font-extrabold text-rose-600">76</p>
          </div>
        </div>

        <div className="mt-2 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
          <p className="flex items-center gap-1 text-[10px] font-bold text-violet-700">
            <i className="ri-sparkling-2-fill" /> 모르는 문제 물어보기
          </p>
          <p className="mt-1 text-[10px] text-slate-500">우리 학원 수업 기록만 보고 답해요</p>
        </div>
      </div>
      <div className="flex border-t border-slate-100 bg-white px-1 py-2">
        {[
          { t: '홈', icon: 'ri-home-5-fill', on: true },
          { t: '숙제', icon: 'ri-book-open-line', on: false },
          { t: '성적', icon: 'ri-line-chart-line', on: false },
          { t: '더보기', icon: 'ri-more-fill', on: false },
        ].map((n) => (
          <div key={n.t} className="flex flex-1 flex-col items-center gap-0.5">
            <i className={cn(n.icon, 'text-sm', n.on ? 'text-emerald-600' : 'text-slate-300')} />
            <span className={cn('text-[8px]', n.on ? 'font-bold text-emerald-600' : 'text-slate-400')}>
              {n.t}
            </span>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}

function BillingMockup() {
  const rows = [
    { name: '김민준', amt: '₩320,000', st: '미납', due: 'D-18' },
    { name: '이서연', amt: '₩280,000', st: '연체', due: 'D+3' },
    { name: '박지호', amt: '₩320,000', st: '완납', due: '—' },
    { name: '최유나', amt: '₩320,000', st: '미납', due: 'D-12' },
  ];
  return (
    <Chrome path="/billing">
      <div className="flex min-h-[340px] bg-[#f4f5f7]">
        <SideNav active="billing" />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-900">수납 · 재등록</p>
              <p className="text-[10px] text-slate-400">이번 달 청구 · 위험 학생 우선</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { l: '미납', v: '12', tone: 'text-rose-600' },
              { l: '연체', v: '3', tone: 'text-amber-600' },
              { l: '수납액', v: '₩4.2M', tone: 'text-slate-900' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center shadow-sm"
              >
                <p className="text-[9px] font-bold text-slate-400">{s.l}</p>
                <p className={cn('mt-1 text-base font-extrabold tabular-nums', s.tone)}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-slate-100 bg-slate-50/90 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span>학생</span>
              <span>금액</span>
              <span>기한</span>
              <span>상태</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.name}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-slate-50 px-3 py-2.5 last:border-0"
              >
                <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-800">
                  <Avatar name={r.name} size="sm" tone={r.st === '완납' ? 'emerald' : 'rose'} />
                  {r.name}
                </span>
                <span className="text-[10px] tabular-nums text-slate-500">{r.amt}</span>
                <span className="text-[10px] tabular-nums text-slate-400">{r.due}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[9px] font-bold',
                    r.st === '완납' && 'bg-emerald-50 text-emerald-700',
                    r.st === '미납' && 'bg-rose-50 text-rose-700',
                    r.st === '연체' && 'bg-amber-50 text-amber-700'
                  )}
                >
                  {r.st}
                </span>
              </div>
            ))}
          </div>
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
