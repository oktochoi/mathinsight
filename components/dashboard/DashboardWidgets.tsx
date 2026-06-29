'use client';

import Link from 'next/link';
import { getLessonFlowState } from '@/lib/learningFlow';
import { formatTimeRange } from '@/lib/scheduleLabels';
import type { DashboardStats, TodayLessonItem } from '@/types/database';
import { cn } from '@/lib/cn';
import {
  DashboardCard,
  WidgetHeader,
  WidgetEmpty,
  KpiCard,
  ActivityIcon,
  StudentAvatar,
  StatusBadge,
} from '@/components/dashboard/DashboardPrimitives';
import { checklistProgress } from '@/lib/dashboardOperations';

const TIMING_LABEL: Record<string, { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' | 'danger' }> = {
  in_progress:   { label: '진행 중',  tone: 'success' },
  starting_soon: { label: '곧 시작',  tone: 'warning' },
  ended:         { label: '종료',     tone: 'neutral' },
  upcoming:      { label: '예정',     tone: 'info' },
  canceled:      { label: '휴강',     tone: 'neutral' },
};

function sortLessons(lessons: TodayLessonItem[]) {
  return [...lessons].sort((a, b) => a.event.startTime.localeCompare(b.event.startTime));
}

export function DashboardChecklistWidget({ stats }: { stats: DashboardStats }) {
  const { done, total, percent } = checklistProgress(stats.todayChecklist);

  return (
    <DashboardCard size="lg" className="h-full">
      <WidgetHeader
        title="오늘 해야 할 일"
        description={`${done}/${total} 완료 · ${percent}%`}
        href="/lesson-logs"
        hrefLabel="수업 기록"
      />

      {/* Progress bar */}
      <div
        className="h-1 rounded-full mb-4 overflow-hidden"
        style={{ background: 'var(--app-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: percent === 100 ? 'var(--app-success)' : 'var(--app-accent)',
          }}
        />
      </div>

      <ul className="space-y-1">
        {stats.todayChecklist.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                item.done
                  ? 'opacity-50'
                  : 'hover:bg-[var(--app-surface-2)] border border-[var(--app-border)]'
              )}
            >
              <span
                className="w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0"
                style={
                  item.done
                    ? { background: 'var(--app-success)', borderColor: 'var(--app-success)' }
                    : { borderColor: 'var(--app-border-strong)', background: 'transparent' }
                }
              >
                {item.done && <i className="ri-check-line text-[10px] text-white" />}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    item.done && 'line-through'
                  )}
                  style={{ color: item.done ? 'var(--app-ink-3)' : 'var(--app-ink)' }}
                >
                  {item.label}
                </p>
                {item.detail && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    {item.detail}
                  </p>
                )}
              </div>
              {!item.done && item.pendingCount > 0 && (
                <span
                  className="text-xs font-bold tabular-nums shrink-0 px-1.5 py-0.5 rounded-md"
                  style={{ background: '#fff7ed', color: '#ea580c' }}
                >
                  {item.pendingCount}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export function DashboardScheduleWidget({ stats }: { stats: DashboardStats }) {
  const today = new Date().toISOString().slice(0, 10);
  const lessons = sortLessons(stats.todayLessons);

  return (
    <DashboardCard size="lg">
      <WidgetHeader
        title="오늘 시간표"
        description={`${lessons.length}개 수업`}
        href="/schedule"
        hrefLabel="시간표"
      />
      {lessons.length === 0 ? (
        <WidgetEmpty message="오늘 등록된 수업이 없습니다." />
      ) : (
        <div className="space-y-2">
          {lessons.map((item) => {
            const state = getLessonFlowState(item, today);
            const timing = TIMING_LABEL[state.timing] ?? TIMING_LABEL.upcoming;
            const isActive = state.timing === 'in_progress';
            const isEnded = state.timing === 'ended';
            return (
              <div
                key={item.event.id}
                className="flex items-stretch gap-3 rounded-xl overflow-hidden transition-all"
                style={{
                  background: isActive
                    ? 'var(--app-accent-bg)'
                    : 'var(--app-surface-2)',
                  border: `1px solid ${isActive ? '#bfdbfe' : 'var(--app-border)'}`,
                  opacity: isEnded ? 0.55 : 1,
                }}
              >
                {/* Time stripe */}
                <div
                  className="w-1 shrink-0 self-stretch rounded-l-xl"
                  style={{
                    background: isActive ? 'var(--app-accent)' : 'var(--app-border-md)',
                  }}
                />
                <div className="flex-1 min-w-0 py-3 pr-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/lesson-logs?class=${item.event.classId}&date=${today}`}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: 'var(--app-ink)' }}
                      >
                        {item.event.className}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                        {formatTimeRange(item.event.startTime, item.event.endTime)}
                        {item.studentCount > 0 && ` · ${item.studentCount}명`}
                      </p>
                    </div>
                    <StatusBadge label={timing.label} tone={timing.tone} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.hasLogToday ? (
                      <StatusBadge label="기록 완료" tone="success" />
                    ) : (state.timing === 'ended' || state.timing === 'in_progress') ? (
                      <StatusBadge label="출결 미입력" tone="warning" />
                    ) : null}
                    {state.badges
                      .filter((b) => !['logged', 'no_log'].includes(b.key))
                      .slice(0, 2)
                      .map((b) => (
                        <StatusBadge key={b.key} label={b.label} tone="info" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

export function DashboardOpsKpiRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KpiCard label="전체 학생"  value={stats.totalStudentCount}          unit="명" icon="ri-group-line"          accent="blue"   href="/students" />
      <KpiCard label="오늘 결석"  value={stats.absentTodayCount}           unit="명" icon="ri-user-unfollow-line"   accent="red"    href="/lesson-logs" />
      <KpiCard label="숙제 미제출" value={stats.missingHomeworkCount}       unit="명" icon="ri-file-close-line"      accent="orange" href="/lesson-logs" />
      <KpiCard label="학부모 문의" value={stats.pendingParentMessagesCount}  unit="건" icon="ri-mail-unread-line"     accent="orange" href="/parent-hub" />
      <KpiCard label="학생 성장"  value={stats.totalStudentCount}          unit="명" icon="ri-line-chart-line"      accent="green"  href="/retention" />
    </div>
  );
}

const AI_CATEGORY_LABEL = {
  counseling: '상담 검토',
  learning:   '학습 현황',
  retention:  '학생 성장',
} as const;

export function DashboardAiWidget({ stats }: { stats: DashboardStats }) {
  return (
    <div
      className="app-card p-5 border-dashed"
      style={{ borderColor: '#c4b5fd', background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)' }}
    >
      <WidgetHeader
        title="운영 메모"
        description="상담·재등록 검토가 필요한 학생"
        href="/students"
        hrefLabel="학생 목록"
      />
      {stats.aiRecommendations.length === 0 ? (
        <WidgetEmpty message="수업 기록이 쌓이면 표시됩니다." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stats.aiRecommendations.map((rec) => (
            <Link
              key={rec.id}
              href={rec.href}
              className="rounded-xl p-4 transition-all hover:shadow-[var(--s-md)]"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <StudentAvatar name={rec.studentName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--app-ink)' }}>
                    {rec.studentName}
                  </p>
                  <StatusBadge label={AI_CATEGORY_LABEL[rec.category]} tone="violet" />
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
                {rec.reason}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardTimelineWidget({ stats }: { stats: DashboardStats }) {
  const timeline = [
    ...stats.recentActivities.map((a) => ({
      id:    `act-${a.time}-${a.text.slice(0, 20)}`,
      type:  a.type,
      title: a.text,
      time:  a.time,
      href:  undefined as string | undefined,
    })),
    ...stats.recentNotices.map((n) => ({
      id:    `notice-${n.id}`,
      type:  'schedule' as const,
      title: `공지: ${n.title}`,
      time:  n.publishedAt
        ? new Date(n.publishedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        : '',
      href: '/notices',
    })),
  ].slice(0, 10);

  return (
    <DashboardCard size="lg">
      <WidgetHeader title="최근 활동" description="상담 · 수업 · 문의 타임라인" href="/notices" hrefLabel="공지" />
      {timeline.length === 0 ? (
        <WidgetEmpty message="최근 활동이 없습니다." />
      ) : (
        <ul className="space-y-3">
          {timeline.map((item, idx) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="relative shrink-0">
                <ActivityIcon type={item.type} />
                {idx < timeline.length - 1 && (
                  <div
                    className="absolute left-1/2 top-full mt-0.5 w-px h-3 -translate-x-1/2"
                    style={{ background: 'var(--app-border)' }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--app-ink-2)' }}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="text-sm leading-snug" style={{ color: 'var(--app-ink-2)' }}>
                    {item.title}
                  </p>
                )}
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-ink-4)' }}>
                  {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

export function DashboardNoticesWidget({ stats }: { stats: DashboardStats }) {
  return (
    <DashboardCard>
      <WidgetHeader title="공지사항" href="/notices" />
      {stats.recentNotices.length === 0 ? (
        <WidgetEmpty message="발행된 공지가 없습니다." />
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
          {stats.recentNotices.slice(0, 4).map((n) => (
            <li key={n.id}>
              <Link
                href="/notices"
                className="block py-3 transition-colors hover:opacity-70"
              >
                <p className="text-sm font-medium truncate" style={{ color: 'var(--app-ink)' }}>
                  {n.title}
                </p>
                {n.publishedAt && (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    {new Date(n.publishedAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

export function DashboardParentMessagesWidget({ stats }: { stats: DashboardStats }) {
  return (
    <DashboardCard>
      <WidgetHeader title="학부모 문의" href="/messages" />
      {stats.pendingParentMessagesCount === 0 ? (
        <WidgetEmpty message="대기 중인 문의가 없습니다." />
      ) : (
        <Link
          href="/messages"
          className="flex flex-col items-center justify-center py-8 rounded-xl transition-all hover:opacity-90"
          style={{
            background: 'var(--app-warning-bg)',
            border: '1px solid #fde68a',
          }}
        >
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color: 'var(--app-warning)', letterSpacing: '-0.04em' }}
          >
            {stats.pendingParentMessagesCount}
          </p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#92400e' }}>
            답변 대기
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
            문의함에서 확인하세요
          </p>
        </Link>
      )}
    </DashboardCard>
  );
}
