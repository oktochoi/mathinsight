'use client';

import { useMemo } from 'react';
import { usePortalChild } from '@/context/PortalChildContext';
import { useParentReports } from '@/hooks/useParentReports';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '#overview', label: '학습 요약', icon: 'ri-file-list-3-line', badgeKey: null },
  { href: '#erp', label: '출결·숙제', icon: 'ri-task-line', badgeKey: null },
  { href: '#notices', label: '공지', icon: 'ri-megaphone-line', badgeKey: null },
  { href: '#inquiry', label: '문의', icon: 'ri-mail-send-line', badgeKey: null },
  { href: '#ask', label: 'AI 질문', icon: 'ri-chat-3-line', badgeKey: null },
  { href: '#details', label: '점수·일정', icon: 'ri-line-chart-line', badgeKey: null },
  { href: '#reports', label: '안내문', icon: 'ri-mail-line', badgeKey: 'reports' as const },
] as const;

function useRecentReportCount(studentId: string | undefined) {
  const { reports } = useParentReports(studentId);
  return useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return reports.filter((r) => r.created_at.slice(0, 10) >= cutoffStr).length;
  }, [reports]);
}

export function ParentNavLinks({ vertical }: { vertical?: boolean }) {
  const { selectedId } = usePortalChild();
  const recentReportCount = useRecentReportCount(selectedId || undefined);

  return (
    <>
      {NAV.map((item) => {
        const showBadge = item.badgeKey === 'reports' && recentReportCount > 0;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              vertical
                ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors'
                : 'parent-nav-pill shrink-0 gap-1.5 relative'
            )}
          >
            <i className={cn(item.icon, vertical && 'text-lg text-indigo-500')} aria-hidden />
            <span className="flex items-center gap-1.5 min-w-0">
              {item.label}
              {showBadge && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none',
                    !vertical && 'absolute -top-1 -right-1 min-w-[18px] text-center'
                  )}
                  title={`최근 2주 새 리포트 ${recentReportCount}건`}
                >
                  {recentReportCount > 99 ? '99+' : recentReportCount}
                </span>
              )}
            </span>
          </a>
        );
      })}
    </>
  );
}
