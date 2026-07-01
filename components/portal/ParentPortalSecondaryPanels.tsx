'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { parentReportPath } from '@/lib/documentRoutes';
import { sanitizeParentReportText } from '@/lib/parentReportFormat';
import { useParentReports } from '@/hooks/useParentReports';
import { usePortalAttendance } from '@/hooks/usePortalErp';
import { usePortalPayments } from '@/hooks/useBilling';
import { usePortalCounselingSessions } from '@/hooks/useCounselingSessions';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import { PortalSection, PortalSubheading } from '@/components/portal/ParentUI';
import { ParentAttendancePanel } from '@/components/portal/ParentAttendancePanel';
import { ParentCounselingPanel } from '@/components/portal/ParentCounselingPanel';
import { ParentNoticesPanel } from '@/components/portal/ParentNoticesPanel';
import { ParentPaymentsPanel } from '@/components/portal/ParentPaymentsPanel';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { cn } from '@/lib/cn';
import type { Student } from '@/types/database';

type Props = {
  child: Student;
  academyName: string;
  tab?: TabId;
  onTabChange?: (tab: TabId) => void;
};

export type TabId = 'attendance' | 'reports' | 'notices' | 'payments' | 'schedule';

export const PARENT_SECONDARY_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'attendance', label: '출결', icon: 'ri-calendar-check-line' },
  { id: 'reports', label: '상담 리포트', icon: 'ri-file-text-line' },
  { id: 'notices', label: '공지', icon: 'ri-megaphone-line' },
  { id: 'payments', label: '수납', icon: 'ri-wallet-3-line' },
  { id: 'schedule', label: '일정', icon: 'ri-calendar-line' },
];

const TAB_ROUTES: Record<TabId, string> = {
  attendance: '/parent/attendance',
  reports: '/parent/reports',
  notices: '/parent/notices',
  payments: '/parent/payments',
  schedule: '/parent/schedule',
};

/** 홈 등에서 각 기능 화면으로 이동하는 카드 */
export function ParentSecondaryQuickCards({
  badges,
}: {
  badges?: Partial<Record<TabId, number>>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PARENT_SECONDARY_TABS.map((t) => {
        const count = badges?.[t.id];
        return (
          <Link
            key={t.id}
            href={TAB_ROUTES[t.id]}
            className="relative flex flex-col items-start gap-1 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <i className={cn(t.icon, 'text-lg text-indigo-600')} aria-hidden />
            <span className="text-xs font-semibold text-stone-800">{t.label}</span>
            {count != null && count > 0 && (
              <span className="absolute top-2 right-2 text-[9px] font-bold min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function useParentSecondaryBadges(child: Student) {
  const { reports } = useParentReports(child.id);
  const { items: notices } = usePortalAnnouncements(child.id, child.class_id);
  const { payments } = usePortalPayments(child.id);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  }, []);

  const recentReports = reports.filter((r) => r.created_at.slice(0, 10) >= cutoff).length;
  const recentNotices = notices.filter((n) => (n.published_at ?? '').slice(0, 10) >= cutoff).length;
  const overduePayments = payments.filter(
    (p) => p.status === 'pending' && p.due_date < new Date().toISOString().slice(0, 10)
  ).length;

  return {
    reports: recentReports,
    notices: recentNotices,
    payments: overduePayments,
  } as Partial<Record<TabId, number>>;
}

export function ParentAttendanceContent({ studentId }: { studentId: string }) {
  return <AttendanceTab studentId={studentId} />;
}

export function ParentReportsContent({ studentId }: { studentId: string }) {
  return <ReportsTab studentId={studentId} />;
}

export function ParentNoticesContent({
  studentId,
  classId,
}: {
  studentId: string;
  classId?: string | null;
}) {
  return <NoticesTab studentId={studentId} classId={classId} />;
}

export function ParentPaymentsContent({ studentId }: { studentId: string }) {
  return <PaymentsTab studentId={studentId} />;
}

export function ParentScheduleContent({
  classId,
  academyName,
}: {
  classId?: string | null;
  academyName: string;
}) {
  return <ScheduleTab classId={classId} academyName={academyName} />;
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const { summary } = usePortalAttendance(studentId);
  return (
    <PortalSection id="attendance" title="출결" description="출석·지각·결석 기록입니다.">
      <ParentAttendancePanel summary={summary} />
    </PortalSection>
  );
}

function ReportsTab({ studentId }: { studentId: string }) {
  const { reports, loading } = useParentReports(studentId);
  const { sessions } = usePortalCounselingSessions(studentId);
  return (
    <PortalSection id="reports" title="상담 리포트" description="상담 후 선생님이 전달한 안내문입니다.">
      {loading ? (
        <p className="text-sm text-stone-500">불러오는 중…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-stone-500 parent-card-soft py-10 text-center">
          아직 상담 리포트가 없습니다.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.slice(0, 8).map((r) => (
            <li key={r.id}>
              <Link
                href={parentReportPath(r.id, 'parent')}
                className="group block parent-card-soft p-4 lg:p-5 h-full hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-indigo-700">
                    {r.period_start} ~ {r.period_end}
                  </p>
                  <i
                    className="ri-arrow-right-s-line text-stone-400 group-hover:text-indigo-600"
                    aria-hidden
                  />
                </div>
                <p className="text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                  {sanitizeParentReportText(r.report_text)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <PortalSubheading>상담 예정</PortalSubheading>
        <ParentCounselingPanel sessions={sessions} />
      </div>
    </PortalSection>
  );
}

function NoticesTab({ studentId, classId }: { studentId: string; classId?: string | null }) {
  const { items } = usePortalAnnouncements(studentId, classId);
  return (
    <PortalSection id="notices" title="학원 공지" description="원장님이 보낸 안내입니다.">
      <ParentNoticesPanel items={items} />
    </PortalSection>
  );
}


function PaymentsTab({ studentId }: { studentId: string }) {
  const { payments, loading } = usePortalPayments(studentId);
  return (
    <PortalSection id="payments" title="수강료 상태" description="청구·납부 현황입니다.">
      <ParentPaymentsPanel payments={payments} loading={loading} />
    </PortalSection>
  );
}

function ScheduleTab({
  classId,
  academyName,
}: {
  classId?: string | null;
  academyName: string;
}) {
  const { progress } = usePortalClassProgress(classId);
  return (
    <>
      <PortalSection id="schedule" title="이번 주 일정" description="수업 일정입니다.">
        <PortalSchedule classIds={classId ? [classId] : []} />
      </PortalSection>
      {progress && (
        <p className="text-xs text-indigo-600">
          현재 진도: <strong>{progress.unit_name}</strong> ({academyName})
        </p>
      )}
    </>
  );
}

function TabBar({
  tab,
  onTabChange,
  badges,
}: {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  badges?: Partial<Record<TabId, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="추가 정보">
      {PARENT_SECONDARY_TABS.map((t) => {
        const count = badges?.[t.id];
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.id
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <i className={t.icon} aria-hidden />
            {t.label}
            {count != null && count > 0 && (
              <span
                className={cn(
                  'ml-0.5 text-[9px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center',
                  tab === t.id ? 'bg-white/25 text-white' : 'bg-indigo-600 text-white'
                )}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 접기 섹션 — 탭 전환 시 해당 데이터만 로딩 */
export function ParentPortalSecondaryPanels({
  child,
  academyName,
  tab: controlledTab,
  onTabChange,
  badges,
}: Props & { badges?: Partial<Record<TabId, number>> }) {
  const [internalTab, setInternalTab] = useState<TabId>('attendance');
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  useEffect(() => {
    if (controlledTab) setInternalTab(controlledTab);
  }, [controlledTab]);

  return (
    <div className="space-y-4">
      <TabBar tab={tab} onTabChange={setTab} badges={badges} />

      {tab === 'attendance' && <AttendanceTab studentId={child.id} />}
      {tab === 'reports' && <ReportsTab studentId={child.id} />}
      {tab === 'notices' && <NoticesTab studentId={child.id} classId={child.class_id} />}
      {tab === 'payments' && <PaymentsTab studentId={child.id} />}
      {tab === 'schedule' && (
        <ScheduleTab classId={child.class_id} academyName={academyName} />
      )}
    </div>
  );
}
