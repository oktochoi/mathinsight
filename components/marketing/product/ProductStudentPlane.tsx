import { cn } from '@/lib/cn';

/**
 * Product 히어로의 지배적 비주얼 — 학생 한 명의 화면을 카드 목업이 아니라 화면 아래로
 * 잘려 나가는 하나의 평면으로 보여준다. 왼쪽에서 오른쪽으로 "기록 → 변화 → 상담 준비"가
 * 한 줄에 놓여, 기록이 상담 준비로 변환되는 지점(student_id 중심)을 설명 없이 증명하는 것이
 * 목적이다. 애니메이션·글로우 없이 밀도와 정렬로만 신뢰를 만든다.
 * 좁은 화면에서는 좌우 레일을 접고 기록 타임라인만 남긴다.
 */

const TIMELINE = [
  { date: '5/22', kind: '수업', body: '이차방정식 응용 · 오답 3', tone: 'plain' },
  { date: '5/22', kind: '숙제', body: '미제출', tone: 'warn' },
  { date: '5/18', kind: '시험', body: '76점 (직전 88점)', tone: 'warn' },
  { date: '5/15', kind: '상담', body: '학습량 늘리기로 합의', tone: 'plain' },
  { date: '5/11', kind: '숙제', body: '미제출', tone: 'warn' },
  { date: '5/08', kind: '출결', body: '지각 1회', tone: 'plain' },
] as const;

const TRENDS = [
  { label: '최근 시험', value: '88 → 76', down: true },
  { label: '숙제 제출률', value: '92% → 67%', down: true },
  { label: '출석', value: '이번 달 100%', down: false },
] as const;

const TALKING_POINTS = [
  '이차방정식 응용에서 반복되는 오답 유형 함께 짚기',
  '5/15 상담 이후 숙제 흐름이 어떻게 달라졌는지 확인',
] as const;

export function ProductStudentPlane() {
  return (
    <div aria-hidden className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16">
        <div className="flex items-center gap-3 border-b border-slate-100 py-3">
          <span className="text-sm font-bold tracking-tight text-slate-800">김민준</span>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="text-sm text-slate-500">중2-A · 담당 김선생</span>
          <span className="ml-auto hidden text-xs tabular-nums text-slate-400 sm:block">
            재등록 D-18 · 다음 상담 5/24 14:00
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_212px_320px]">
          {/* 기록 — 학생 아래로 모인 하루하루 */}
          <div className="py-6 lg:pr-8">
            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">기록</h3>
              <p className="text-xs text-slate-400">출결 · 숙제 · 성적 · 상담이 한 줄로</p>
            </div>

            <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
              {TIMELINE.map((row, i) => (
                <div
                  key={`${row.date}-${i}`}
                  className="grid grid-cols-[46px_56px_1fr] items-center gap-3 py-2.5 text-[13px]"
                >
                  <span className="tabular-nums text-slate-400">{row.date}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {row.kind}
                  </span>
                  <span
                    className={cn(
                      'truncate',
                      row.tone === 'warn' ? 'font-semibold text-slate-800' : 'text-slate-600'
                    )}
                  >
                    {row.body}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 변화 — 기록이 만든 추세 */}
          <div className="hidden border-slate-100 py-6 lg:block lg:border-x lg:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">변화</p>
            <div className="mt-3 space-y-4">
              {TRENDS.map((t) => (
                <div key={t.label}>
                  <p className="text-[11px] text-slate-500">{t.label}</p>
                  <p
                    className={cn(
                      'mt-0.5 text-sm font-semibold tabular-nums',
                      t.down ? 'text-amber-700' : 'text-slate-700'
                    )}
                  >
                    {t.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 상담 준비 — AI는 라벨 하나와 근거 줄로만 존재한다 */}
          <aside className="hidden py-6 lg:block lg:pl-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              상담 준비
            </p>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">
                <i className="ri-sparkling-2-line" />
                상담 전 30초 요약
              </p>
              <p className="mt-2 border-l-2 border-violet-300 pl-3 text-[13px] leading-relaxed text-slate-700">
                이차방정식에서 반복해서 막히고 있고, 숙제가 두 번 밀렸습니다.
              </p>
              <p className="mt-2 pl-3 text-[11px] tabular-nums text-slate-400">
                근거 · 5/18 시험 88→76 · 숙제 미제출 2회 · 지난 상담 5/15
              </p>
            </div>

            <ul className="mt-4 space-y-2.5">
              {TALKING_POINTS.map((p, i) => (
                <li key={p} className="grid grid-cols-[16px_1fr] gap-2 text-[12px] leading-relaxed">
                  <span className="pt-px text-[11px] font-bold tabular-nums text-emerald-700">
                    {i + 1}
                  </span>
                  <span className="text-slate-600">{p}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
