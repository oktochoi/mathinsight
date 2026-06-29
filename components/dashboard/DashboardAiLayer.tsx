'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/types/database';
import { DashboardCard, WidgetHeader, StudentAvatar } from '@/components/dashboard/DashboardPrimitives';
import { StatusBadge } from '@/components/data-ui/StatusBadge';
import { cn } from '@/lib/cn';

const TASK_CATEGORY: Record<
  string,
  { label: string; tone: 'ai' | 'warning' | 'danger' | 'info' }
> = {
  counseling: { label: '상담 권장', tone: 'ai' },
  learning: { label: '학습 현황', tone: 'warning' },
  retention: { label: '재등록 확인', tone: 'danger' },
  parent: { label: '학부모 연락', tone: 'info' },
};

/** 오늘의 AI 추천 업무 */
export function DashboardAiTasksWidget({ stats }: { stats: DashboardStats }) {
  const items = stats.aiRecommendations;

  return (
    <DashboardCard
      className="border-indigo-100/80 h-full"
      size="lg"
      style={{ background: 'linear-gradient(135deg, rgba(238,242,255,0.4) 0%, var(--app-surface) 100%)' }}
    >
      <WidgetHeader
        title="오늘의 AI 추천 업무"
        description="운영 판단을 돕는 우선 확인 목록"
        href="/students"
        hrefLabel="전체 학생"
      />
      {items.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--app-ink-4)' }}>
          수업·출결 기록이 쌓이면 추천 업무가 표시됩니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((rec) => {
            const cat = TASK_CATEGORY[rec.category] ?? TASK_CATEGORY.counseling;
            return (
              <li key={rec.id}>
                <Link
                  href={rec.href}
                  className="flex items-start gap-3 p-3 rounded-lg transition-all hover:shadow-sm"
                  style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}
                >
                  <StudentAvatar name={rec.studentName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>{rec.studentName}</span>
                      <StatusBadge label={cat.label} tone={cat.tone} size="sm" />
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>{rec.reason}</p>
                  </div>
                  <i className="ri-arrow-right-s-line shrink-0 mt-1" style={{ color: 'var(--app-ink-4)' }} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

/** AI 운영 요약 — 오늘 먼저 확인할 핵심 3가지 */
export function DashboardAiSummaryWidget({ stats }: { stats: DashboardStats }) {
  const highlights = stats.morningBriefLines.slice(0, 3);

  return (
    <DashboardCard
      className="border-indigo-100/80 h-full"
      size="lg"
      style={{ background: 'linear-gradient(135deg, rgba(245,243,255,0.3) 0%, var(--app-surface) 100%)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <i className="ri-sparkling-2-line text-indigo-600" />
        </span>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>AI 운영 요약</h3>
          <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>오늘 먼저 확인할 핵심 사항</p>
        </div>
      </div>
      {highlights.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--app-ink-4)' }}>운영 데이터를 분석 중입니다.</p>
      ) : (
        <ol className="space-y-3">
          {highlights.map((line, i) => (
            <li
              key={i}
              className={cn(
                'flex gap-3 text-sm leading-relaxed',
                i === 0 ? 'font-medium' : ''
              )}
              style={{ color: i === 0 ? 'var(--app-ink)' : 'var(--app-ink-2)' }}
            >
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}

/** AI 상담 준비 — 상담 예정 학생 요약 카드 */
export function DashboardAiCounselingPrepWidget({ stats }: { stats: DashboardStats }) {
  const queue = stats.todayCounselingQueue.slice(0, 4);
  const prepStudents = stats.worseningStudents.slice(0, 3);

  return (
    <DashboardCard className="h-full" size="lg">
      <WidgetHeader
        title="AI 상담 준비"
        description="상담 예정 · 검토 필요 학생"
        href="/counseling?step=prep"
        hrefLabel="상담센터"
      />
      {queue.length === 0 && prepStudents.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--app-ink-4)' }}>오늘 예정된 상담이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {queue.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--app-ink-4)' }}>
                상담 예정
              </p>
              <ul className="space-y-2">
                {queue.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/counseling?step=session&student=${s.studentId}`}
                      className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--app-accent-bg)]"
                      style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}
                    >
                      <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>{s.studentName}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>{s.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {prepStudents.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-2">
                상담 준비 메모
              </p>
              <ul className="space-y-2">
                {prepStudents.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/counseling?step=prep&student=${s.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border-indigo-100 bg-indigo-50/20 px-3 py-2.5 hover:bg-indigo-50/50"
                      style={{ border: '1px solid' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>{s.name}</span>
                      <span className="text-xs text-indigo-700 truncate max-w-[140px]">
                        {s.reason || '최근 변화 확인'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

/** Dashboard AI Assistant Layer — 운영 60 · AI 25 */
export function DashboardAiLayer({ stats }: { stats: DashboardStats }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>AI Assistant</h2>
        <StatusBadge label="운영 판단 지원" tone="ai" size="sm" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <DashboardAiSummaryWidget stats={stats} />
        <DashboardAiTasksWidget stats={stats} />
        <DashboardAiCounselingPrepWidget stats={stats} />
      </div>
    </section>
  );
}
