'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePortalChild } from '@/context/PortalChildContext';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { calculateHomeworkTrend, calculateScoreTrend } from '@/lib/analytics';
import { usePortalHomework, usePortalExams } from '@/hooks/usePortalErp';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { usePortalPayments } from '@/hooks/useBilling';
import { useParentReports } from '@/hooks/useParentReports';
import { ParentPortalGate } from '@/components/portal/ParentPortalGate';
import { ParentChildHeader } from '@/components/portal/ParentChildHeader';
import { ParentSecondaryQuickCards, useParentSecondaryBadges } from '@/components/portal/ParentPortalSecondaryPanels';
import type { Student } from '@/types/database';
import { cn } from '@/lib/cn';

type AlertCard = {
  href: string;
  title: string;
  description: string;
  icon: string;
  tone: 'indigo' | 'amber' | 'rose';
};

function ParentHomeContent() {
  const { child } = usePortalChild();
  if (!child) return null;

  const { logs } = useLessonLogs({ studentId: child.id, limit: 30 });
  const { assignments } = usePortalHomework(child.id, child.class_id);
  const { exams: portalExams } = usePortalExams(child.id);
  const { items: notices } = usePortalAnnouncements(child.id, child.class_id);
  const { payments } = usePortalPayments(child.id);
  const { reports } = useParentReports(child.id);
  const badges = useParentSecondaryBadges(child);

  const scoreTrend = calculateScoreTrend(logs);
  const hw = calculateHomeworkTrend(logs);
  const latestScore = scoreTrend.recentAvg;

  const today = new Date().toISOString().slice(0, 10);
  const pendingHw = assignments.filter(
    (a) => !a.submission || a.submission.status !== 'complete'
  ).length;
  const overduePay = payments.filter(
    (p) => p.status === 'pending' && p.due_date < today
  ).length;
  const recentNotices = notices.filter(
    (n) => (n.published_at ?? '').slice(0, 10) >= today.slice(0, 8) + '-01'
  ).length;
  const recentReports = reports.filter((r) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    return r.created_at.slice(0, 10) >= cutoff.toISOString().slice(0, 10);
  }).length;

  const alerts = useMemo(() => {
    const list: AlertCard[] = [];
    if (pendingHw > 0) {
      list.push({
        href: '/parent/learning',
        title: `숙제 ${pendingHw}건 확인`,
        description: '제출·미제출 상태를 확인하세요.',
        icon: 'ri-task-line',
        tone: 'amber',
      });
    }
    if (portalExams.length > 0 && latestScore != null) {
      list.push({
        href: '/parent/learning',
        title: `최근 점수 ${latestScore}점`,
        description: '성적 변화를 확인하세요.',
        icon: 'ri-line-chart-line',
        tone: 'indigo',
      });
    }
    if (recentNotices > 0 || (badges.notices ?? 0) > 0) {
      list.push({
        href: '/parent/notices',
        title: '새 공지가 있습니다',
        description: '학원 안내를 확인하세요.',
        icon: 'ri-megaphone-line',
        tone: 'indigo',
      });
    }
    if (overduePay > 0) {
      list.push({
        href: '/parent/payments',
        title: `수강료 ${overduePay}건 확인`,
        description: '납부 기한을 확인하세요.',
        icon: 'ri-wallet-3-line',
        tone: 'rose',
      });
    }
    if (recentReports > 0) {
      list.push({
        href: '/parent/reports',
        title: `새 상담 리포트 ${recentReports}건`,
        description: '선생님 안내문을 읽어 주세요.',
        icon: 'ri-file-text-line',
        tone: 'indigo',
      });
    }
    return list;
  }, [pendingHw, portalExams.length, latestScore, recentNotices, badges.notices, overduePay, recentReports]);

  return (
    <div className="space-y-6 max-w-lg mx-auto lg:max-w-2xl">
      <ParentChildHeader
        child={child}
        latestScore={latestScore}
        hwRate={hw.recentRate}
        logCount={logs.length}
        compact
      />

      <section className="parent-card p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">오늘 확인할 것</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            필요한 항목만 골라 보여 드립니다. 궁금한 점은 우하단 채팅 아이콘을 이용하세요.
          </p>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-stone-600 parent-card-soft p-4 text-center">
            지금은 특별히 확인할 알림이 없습니다. 학습·출결 화면에서 자세히 볼 수 있어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.href + a.title}>
                <Link
                  href={a.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:shadow-sm',
                    a.tone === 'rose' && 'border-rose-200 bg-rose-50/80 hover:border-rose-300',
                    a.tone === 'amber' && 'border-amber-200 bg-amber-50/80 hover:border-amber-300',
                    a.tone === 'indigo' && 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300'
                  )}
                >
                  <i className={cn(a.icon, 'text-xl text-indigo-600 shrink-0')} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{a.title}</p>
                    <p className="text-xs text-stone-500">{a.description}</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-stone-400 ml-auto shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="parent-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-stone-800">바로가기</h2>
        <ParentSecondaryQuickCards badges={badges} />
      </section>
    </div>
  );
}

export default function ParentHomePageClient() {
  return (
    <ParentPortalGate>{() => <ParentHomeContent />}</ParentPortalGate>
  );
}
