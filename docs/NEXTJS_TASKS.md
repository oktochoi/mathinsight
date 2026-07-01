# Next.js 작업 목록

Flutter 앱 연동 + UI 개선 구현을 위해 Next.js 코드에서 해야 할 것들.

---

## 0. FCM 토큰 등록 (로그인 직후)

Flutter가 토큰을 웹으로 보내오면, 웹이 서버에 저장해야 한다.

### 어디에 추가하나

로그인 성공 처리를 하는 곳 — 보통 `app/login/` 또는 `components/auth/` 쪽 `onAuthStateChange` 리스너.

```ts
// 로그인 성공 후 실행
import { flutterBridge } from '@/lib/flutterBridge';

async function onLoginSuccess() {
  if (!flutterBridge.isFlutter) return; // 웹 브라우저면 패스

  const token = await flutterBridge.getFcmToken();
  if (!token) return;

  await fetch('/api/push/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: 'android' }), // iOS면 'ios'
  });
}
```

### 토큰 갱신 수신도 처리

로그인 이후에도 FCM 토큰이 갱신될 수 있다. `_layout.tsx` 또는 최상위 `Provider`에서 한 번만 등록:

```ts
import { flutterBridge } from '@/lib/flutterBridge';
import { useEffect } from 'react';

// 앱 마운트 시 1회
useEffect(() => {
  return flutterBridge.onMessage<{ token: string }>('FCM_TOKEN', async ({ token }) => {
    await fetch('/api/push/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  });
}, []);
```

### 로그아웃 시 토큰 삭제

```ts
async function onLogout(token: string) {
  await fetch(`/api/push/token?token=${encodeURIComponent(token)}`, {
    method: 'DELETE',
  });
}
```

---

## 1. 대시보드 — 주목할 학생 카드

**새 파일:** `components/dashboard/DashboardAttentionStudents.tsx`

이미 `stats.attentionStudents`에 이름·신호·위험도가 있다. 이것을 화면에 꺼내는 것.

```tsx
'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { DashboardStats } from '@/types/database';
import type { RiskDisplayKind } from '@/lib/studentRisk';

const RISK_META: Record<RiskDisplayKind, {
  dot: string; bg: string; label: string; actionLabel: string;
}> = {
  consultation: { dot: 'bg-red-500',     bg: 'bg-red-50 border-red-100',       label: '상담 권장', actionLabel: '상담 준비' },
  makeup:        { dot: 'bg-violet-500',  bg: 'bg-violet-50 border-violet-100', label: '보강 권장', actionLabel: '학생 보기' },
  attention:     { dot: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-100',   label: '주의',      actionLabel: '학생 보기' },
  recovering:    { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', label: '회복 중', actionLabel: '확인' },
  stable:        { dot: 'bg-slate-300',   bg: 'bg-slate-50 border-slate-100',   label: '양호',      actionLabel: '보기' },
};

export function DashboardAttentionStudents({ stats }: { stats: DashboardStats }) {
  const topStudents = stats.attentionStudents
    .filter(s => s.riskKind === 'consultation' || s.riskKind === 'makeup')
    .slice(0, 3);

  const attentionIds = new Set(topStudents.map(s => s.studentId));
  const retentionAlerts = stats.retentionRiskStudents
    .filter(r => r.riskLevel === 'high' && !attentionIds.has(r.studentId))
    .slice(0, 2);

  if (topStudents.length === 0 && retentionAlerts.length === 0) return null;

  return (
    <section className="rounded-2xl overflow-hidden"
             style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: 'var(--app-border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>오늘 확인할 학생</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {topStudents.length + retentionAlerts.length}명
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color: 'var(--app-ink-4)' }}>AI 분석</span>
      </div>

      <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
        {topStudents.map(student => {
          const meta = RISK_META[student.riskKind];
          return (
            <li key={student.studentId} className={cn('px-5 py-4 flex items-start gap-4', meta.bg)}>
              <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', meta.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>{student.name}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ background: 'white', color: 'var(--app-ink-2)', borderColor: 'var(--app-border)' }}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
                  {student.signals.slice(0, 2).join(' · ')}
                </p>
              </div>
              <Link href={`/students/${student.studentId}#consultation`}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--app-accent)' }}>
                {meta.actionLabel} →
              </Link>
            </li>
          );
        })}

        {retentionAlerts.map(r => (
          <li key={r.studentId} className="px-5 py-4 flex items-start gap-4 bg-orange-50">
            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>{r.name}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-white text-orange-700 border-orange-200">
                  재등록 위험
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{r.reason}</p>
            </div>
            <Link href={`/students/${r.studentId}`}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white">
              학생 보기 →
            </Link>
          </li>
        ))}
      </ul>

      {stats.attentionStudents.length > 3 && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--app-border)' }}>
          <Link href="/students?filter=attention" className="text-xs font-medium"
                style={{ color: 'var(--app-accent)' }}>
            전체 {stats.attentionStudents.length}명 보기 →
          </Link>
        </div>
      )}
    </section>
  );
}
```

**`DashboardActionBoard.tsx` 순서 변경:**

```tsx
// 변경 전
<TodayCommandCenter />
<TodayTasksPanel />
<TodayLessonsPanel />

// 변경 후
<TodayCommandCenter />
<DashboardAttentionStudents stats={stats} />   {/* ← 새로 추가 */}
<TodayLessonsPanel />
<TodayTasksPanel />
```

---

## 2. Morning Brief — 회색 박스 삭제, 인사말에 통합

**`TodayCommandCenter.tsx` 수정** — 인사말 바로 아래에 `morningBriefLines[0]` 추가:

```tsx
{/* 기존 인사말 h1 아래에 추가 */}
{stats.morningBriefLines[0] && (
  <div className="flex items-start gap-2.5 mt-3 p-3 rounded-xl"
       style={{
         background: 'var(--app-accent-bg)',
         border: '1px solid var(--app-accent-border)',
       }}>
    <i className="ri-sparkling-line text-sm shrink-0 mt-0.5"
       style={{ color: 'var(--app-accent)' }} />
    <p className="text-sm leading-relaxed" style={{ color: 'var(--app-accent-ink)' }}>
      {stats.morningBriefLines[0]}
    </p>
  </div>
)}
```

**`app/globals.css`에 토큰 3개 추가:**

```css
--app-accent-bg: #eff6ff;
--app-accent-border: #bfdbfe;
--app-accent-ink: #1d4ed8;
```

**`DashboardAiInsightFooter.tsx` 삭제** + `DashboardActionBoard.tsx`에서 import/사용 제거.

---

## 3. 학생 상세 — "상담 권장" 뱃지 → 이유 패널

**`StudentDetailHero.tsx` 수정** — 기존 배지 조건부 렌더를 확장:

```tsx
{/* 변경 후 */}
{signal.tone !== 'ok' && risk && risk.signals.length > 0 ? (
  <div className="mt-4 rounded-xl border p-4 space-y-3"
       style={{
         background: risk.kind === 'consultation' ? '#fff1f2' : '#faf5ff',
         borderColor: risk.kind === 'consultation' ? '#fecdd3' : '#e9d5ff',
       }}>
    <div className="flex items-center gap-2">
      <i className={cn('text-sm',
        risk.kind === 'consultation'
          ? 'ri-alarm-warning-line text-red-600'
          : 'ri-information-line text-violet-600')} />
      <p className="text-sm font-bold"
         style={{ color: risk.kind === 'consultation' ? '#991b1b' : '#5b21b6' }}>
        {risk.kind === 'consultation' ? '상담이 필요한 이유' : '보강을 검토할 이유'}
      </p>
    </div>

    <ul className="space-y-1">
      {risk.signals
        .filter(s => s.id !== 'ok' && s.id !== 'recovering')
        .map(s => (
          <li key={s.id} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-1 w-1 h-1 rounded-full"
                  style={{ background: risk.kind === 'consultation' ? '#ef4444' : '#8b5cf6' }} />
            <span style={{ color: 'var(--app-ink-2)' }}>{s.label}</span>
          </li>
        ))}
    </ul>

    <button
      onClick={() => setBriefingOpen(true)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
      style={{ background: risk.kind === 'consultation' ? '#dc2626' : '#7c3aed' }}>
      <i className="ri-chat-smile-3-line text-sm" />
      {risk.kind === 'consultation' ? '상담 준비 바로가기' : '보강 내용 확인'}
    </button>
  </div>
) : (
  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 ...">양호</span>
)}
```

상태 추가:
```tsx
const [briefingOpen, setBriefingOpen] = useState(false);
```

---

## 4. 상담 시작 → 브리핑 오버레이

**새 파일:** `components/student-detail/ConsultationBriefingOverlay.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import type { RiskDisplayKind } from '@/lib/studentRisk';

export function ConsultationBriefingOverlay({
  studentId,
  briefing,
  kind,
  onClose,
}: {
  studentId: string;
  briefing: { headline: string; lines: string[] };
  kind: RiskDisplayKind;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.4)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
           style={{ background: 'var(--app-surface)' }}
           onClick={e => e.stopPropagation()}>

        <div className="px-5 py-4 border-b flex items-center justify-between"
             style={{
               background: kind === 'consultation' ? '#fff1f2' : '#faf5ff',
               borderColor: kind === 'consultation' ? '#fecdd3' : '#e9d5ff',
             }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
               style={{ color: kind === 'consultation' ? '#991b1b' : '#5b21b6' }}>
              상담 전 30초 브리핑
            </p>
            <p className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>
              {briefing.headline}
            </p>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ color: 'var(--app-ink-3)' }}>
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="px-5 py-5">
          <ul className="space-y-3">
            {briefing.lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                      style={{ background: 'var(--app-accent)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={() => { onClose(); router.push(`/counseling?step=session&student=${studentId}`); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'var(--app-accent)' }}>
            이 브리핑으로 상담 시작
          </button>
          <button onClick={onClose}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-3)',
                           border: '1px solid var(--app-border)' }}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
```

**`StudentDetailHero.tsx`에 연결:**

```tsx
// props에 추가
briefing: { headline: string; lines: string[] } | null;

// JSX 마지막에 추가
{briefingOpen && briefing && (
  <ConsultationBriefingOverlay
    studentId={studentId}
    briefing={briefing}
    kind={risk?.kind ?? 'stable'}
    onClose={() => setBriefingOpen(false)}
  />
)}
```

`StudentDetail.tsx`에서 이미 `analytics.briefing` 계산하고 있음 → Hero에 prop으로 전달만 하면 됨.

---

## 5. 학부모 포털 — 빈 채팅 대신 오늘 요약 먼저

**새 파일:** `components/portal/ParentTodaySummary.tsx`

```tsx
'use client';

import type { LessonLog, HomeworkAssignment } from '@/types/database';

const SUGGESTED = [
  '요즘 숙제를 잘 해오나요?',
  '이번 달 수업 흐름이 어때요?',
  '어떤 부분을 더 신경 써야 할까요?',
] as const;

export function ParentTodaySummary({
  studentName,
  todayLog,
  latestLog,
  pendingAssignments,
  onAsk,
}: {
  studentName: string;
  todayLog: LessonLog | null;
  latestLog: LessonLog | null;
  pendingAssignments: HomeworkAssignment[];
  onAsk: (q: string) => void;
}) {
  const displayLog = todayLog ?? latestLog;
  if (!displayLog && pendingAssignments.length === 0) return null;

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>

      <div className="px-5 py-4 border-b"
           style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)',
                    borderColor: 'var(--app-border)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
           style={{ color: 'var(--app-ink-4)' }}>{today}</p>
        <p className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>
          {studentName} 학생 오늘
        </p>
      </div>

      <div className="px-5 py-4 space-y-2">
        {displayLog?.attendance_status && (
          <Row icon="ri-checkbox-circle-line"
               iconColor={displayLog.attendance_status === 'present' ? '#10b981' : '#ef4444'}
               label="출결"
               value={displayLog.attendance_status === 'present' ? '출석' : '결석'} />
        )}
        {displayLog?.memo?.trim() && (
          <Row icon="ri-chat-quote-line" iconColor="#6366f1"
               label="선생님 메모" value={`"${displayLog.memo.trim()}"`} highlight />
        )}
        {displayLog?.homework_status && (
          <Row icon="ri-book-2-line"
               iconColor={displayLog.homework_status === 'missing' ? '#ef4444' : '#f59e0b'}
               label="숙제"
               value={displayLog.homework_status === 'missing' ? '미제출' : '제출'} />
        )}
        {displayLog?.test_score != null && (
          <Row icon="ri-bar-chart-box-line" iconColor="#2563eb"
               label="점수" value={`${displayLog.test_score}점`} />
        )}
        {pendingAssignments[0] && (
          <Row icon="ri-task-line" iconColor="#d97706"
               label="다음 숙제" value={pendingAssignments[0].title} />
        )}
      </div>

      <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--app-border)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--app-ink-3)' }}>
          AI에게 더 물어보기
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => onAsk(q)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-blue-50"
                    style={{ borderColor: 'var(--app-accent)', color: 'var(--app-accent)', background: 'white' }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, iconColor, label, value, highlight = false }: {
  icon: string; iconColor: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${highlight ? 'bg-indigo-50' : ''}`}>
      <i className={`${icon} text-base shrink-0 mt-0.5`} style={{ color: iconColor }} />
      <div>
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--app-ink-4)' }}>{label}</p>
        <p className="text-sm" style={{ color: 'var(--app-ink)' }}>{value}</p>
      </div>
    </div>
  );
}
```

**`app/parent/PageClient.tsx` 수정:**

```tsx
// 상단에 추가
const chatRef = useRef<{ sendMessage: (q: string) => void }>(null);
const today = new Date().toISOString().slice(0, 10);

// JSX에서 ParentAgentChat 위에 삽입
<ParentTodaySummary
  studentName={child.name}
  todayLog={logs.find(l => l.lesson_date === today) ?? null}
  latestLog={logs[0] ?? null}
  pendingAssignments={assignments.filter(a => a.status !== 'submitted')}
  onAsk={(q) => chatRef.current?.sendMessage(q)}
/>
<ParentAgentChat ref={chatRef} ... />
```

**`ParentAgentChat.tsx`에 ref 노출:**

```tsx
import { forwardRef, useImperativeHandle } from 'react';

const ParentAgentChat = forwardRef<{ sendMessage: (q: string) => void }, Props>(
  function ParentAgentChat(props, ref) {
    // ... 기존 코드

    useImperativeHandle(ref, () => ({
      sendMessage: (q: string) => void send(q),
    }));

    // ... 나머지
  }
);
```

---

## 6. 재등록 파이프라인 스냅샷 카드

**새 파일:** `components/dashboard/ReregistrationSnapshotCard.tsx`

```tsx
'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';

export function ReregistrationSnapshotCard({ stats }: { stats: DashboardStats }) {
  const highRisk = stats.retentionRiskStudents.filter(r => r.riskLevel === 'high');
  const medRisk  = stats.retentionRiskStudents.filter(r => r.riskLevel === 'medium');
  const total    = stats.retentionRiskStudents.length;
  if (total === 0) return null;

  const highNames  = highRisk.slice(0, 2).map(r => r.name).join('·');
  const highExtra  = highRisk.length > 2 ? ` 외 ${highRisk.length - 2}명` : '';

  return (
    <section className="rounded-2xl overflow-hidden"
             style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
               style={{ color: 'var(--app-ink-4)' }}>이번 달 재등록</p>
            <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
              재등록 검토 학생 <span className="text-base">{total}</span>명
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-0.5 h-2 rounded-full overflow-hidden">
              {highRisk.length > 0 && (
                <div className="bg-red-500 rounded-l-full"
                     style={{ width: `${(highRisk.length / total) * 100}%` }} />
              )}
              {medRisk.length > 0 && (
                <div className="bg-amber-400"
                     style={{ width: `${(medRisk.length / total) * 100}%` }} />
              )}
              <div className="flex-1 bg-emerald-300 rounded-r-full" />
            </div>
            <span className="text-xs shrink-0" style={{ color: 'var(--app-ink-3)' }}>
              위험 {highRisk.length} / 주의 {medRisk.length} / 안정 {total - highRisk.length - medRisk.length}
            </span>
          </div>

          {highRisk.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
              <span className="font-semibold text-red-600">{highNames}{highExtra}</span>
              {' '}— 이번 주 상담 권장
            </p>
          )}
        </div>

        <Link href="/retention"
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)',
                       border: '1px solid var(--app-border)' }}>
          전체 보기 →
        </Link>
      </div>
    </section>
  );
}
```

**`DashboardActionBoard.tsx`에 삽입:**

```tsx
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <ReregistrationSnapshotCard stats={stats} />
  <BillingSnapshotCard stats={stats} />
</div>
```

---

## 7. 학생 활동 타임라인 — 아이콘 + 색상 + 점수 변화

**`StudentActivityTimeline.tsx` 수정:**

파일 상단에 메타 맵 추가:

```tsx
const ENTRY_META: Record<TimelineEntryType, { icon: string; color: string; dotColor: string }> = {
  consultation_card:  { icon: 'ri-discuss-line',         color: '#6366f1', dotColor: '#818cf8' },
  parent_report:      { icon: 'ri-file-text-line',       color: '#0891b2', dotColor: '#22d3ee' },
  lesson_memo:        { icon: 'ri-chat-quote-line',      color: '#7c3aed', dotColor: '#a78bfa' },
  score:              { icon: 'ri-bar-chart-box-line',   color: '#2563eb', dotColor: '#60a5fa' },
  homework_missing:   { icon: 'ri-alert-line',           color: '#dc2626', dotColor: '#f87171' },
  attendance:         { icon: 'ri-calendar-close-line',  color: '#ea580c', dotColor: '#fb923c' },
  counseling_session: { icon: 'ri-psychotherapy-line',   color: '#059669', dotColor: '#34d399' },
  followup:           { icon: 'ri-checkbox-circle-line', color: '#0369a1', dotColor: '#38bdf8' },
};
```

점수 delta 계산 (entries 순회 전에):

```tsx
const scoreEntries = entries.filter(e => e.type === 'score');

// 각 entry 렌더 시
const meta = ENTRY_META[entry.type];
const scoreIdx = entry.type === 'score'
  ? scoreEntries.findIndex(e => e.id === entry.id)
  : -1;
const prevScore = scoreIdx >= 0 && scoreIdx < scoreEntries.length - 1
  ? parseFloat(scoreEntries[scoreIdx + 1].detail.match(/(\d+)점/)?.[1] ?? '0')
  : null;
const thisScore = parseFloat(entry.detail.match(/(\d+)점/)?.[1] ?? '0');
const scoreDelta = prevScore != null ? thisScore - prevScore : null;
```

dot 렌더 교체:

```tsx
<li key={entry.id} className="relative pl-8">
  <div className="absolute left-0 top-0.5 w-4 h-4 rounded-full flex items-center justify-center"
       style={{ background: meta.color + '20', border: `1.5px solid ${meta.dotColor}` }}>
    <i className={`${meta.icon} text-[9px]`} style={{ color: meta.color }} />
  </div>

  <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
    {entry.title}
    {scoreDelta != null && (
      <span className={`ml-2 text-xs font-bold ${
        scoreDelta > 0 ? 'text-emerald-600' : scoreDelta < 0 ? 'text-red-600' : 'text-slate-400'
      }`}>
        {scoreDelta > 0 ? `↑ +${scoreDelta}점` : scoreDelta < 0 ? `↓ ${scoreDelta}점` : '변화 없음'}
      </span>
    )}
  </p>
  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>{entry.detail}</p>
</li>
```

---

## 8. 진행 중 수업 Pulse Dot

**`TodayLessonsPanel.tsx` 수정** — `isActive` 조건 안에 추가:

```tsx
{isActive && (
  <span className="relative flex h-2 w-2 mr-2 shrink-0">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
  </span>
)}
```

Tailwind `animate-ping`은 기본 포함 — 추가 설정 불필요.

---

## 체크리스트

```
[x] 0. 로그인 훅에 FCM 토큰 등록 연결
[x] 0. 최상위 레이아웃에 FCM 토큰 갱신 리스너 등록
[x] 1. DashboardAttentionStudents.tsx 생성 + DashboardActionBoard에 삽입
[x] 2. TodayCommandCenter morningBriefLine 추가 + DashboardAiInsightFooter 삭제
[x] 2. globals.css 토큰 3개 추가
[x] 3. StudentDetailHero 이유 패널로 교체
[x] 4. ConsultationBriefingOverlay.tsx 생성 + Hero에 연결
[x] 5. ParentTodaySummary.tsx 생성 + PageClient에 삽입
[x] 5. ParentAgentChat에 useImperativeHandle ref 노출
[x] 6. ReregistrationSnapshotCard.tsx 생성 + DashboardActionBoard에 삽입
[x] 7. StudentActivityTimeline 아이콘 + 점수 delta 추가
[x] 8. TodayLessonsPanel pulse dot 추가
```
