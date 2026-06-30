'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parentReportPath } from '@/lib/documentRoutes';
import { sanitizeParentReportText } from '@/lib/parentReportFormat';
import { useParentReports } from '@/hooks/useParentReports';
import { usePortalAttendance } from '@/hooks/usePortalErp';
import { usePortalPayments } from '@/hooks/useBilling';
import { usePortalCounselingSessions } from '@/hooks/useCounselingSessions';
import { usePortalAnnouncements } from '@/hooks/useAnnouncements';
import { useParentMessagesPortal } from '@/hooks/useParentMessages';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import { PortalSection, PortalSubheading } from '@/components/portal/ParentUI';
import { ParentAttendancePanel } from '@/components/portal/ParentAttendancePanel';
import { ParentCounselingPanel } from '@/components/portal/ParentCounselingPanel';
import { ParentNoticesPanel } from '@/components/portal/ParentNoticesPanel';
import { ParentPaymentsPanel } from '@/components/portal/ParentPaymentsPanel';
import { ParentMessagesPanel } from '@/components/portal/ParentMessagesPanel';
import { ParentChatPanel } from '@/components/chat/ParentChatPanel';
import { PortalSchedule } from '@/components/portal/PortalSchedule';
import { cn } from '@/lib/cn';
import type { Student } from '@/types/database';

type Props = {
  child: Student;
  academyName: string;
};

type TabId = 'attendance' | 'reports' | 'notices' | 'inquiry' | 'payments' | 'schedule';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'attendance', label: '출결', icon: 'ri-calendar-check-line' },
  { id: 'reports', label: '상담 리포트', icon: 'ri-file-text-line' },
  { id: 'notices', label: '공지', icon: 'ri-megaphone-line' },
  { id: 'inquiry', label: '문의', icon: 'ri-mail-send-line' },
  { id: 'payments', label: '수납', icon: 'ri-wallet-3-line' },
  { id: 'schedule', label: '일정', icon: 'ri-calendar-line' },
];

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

function InquiryTab({ child }: { child: Student }) {
  const [mode, setMode] = useState<'chat' | 'ticket'>('chat');
  const { messages, sendMessage } = useParentMessagesPortal(child.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="문의 방식">
        {(
          [
            ['chat', '선생님께 메시지', 'ri-chat-3-line'],
            ['ticket', '일회 문의', 'ri-mail-send-line'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              mode === id
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <i className={icon} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {mode === 'chat' ? (
        <ParentChatPanel child={child} />
      ) : (
        <ParentMessagesPanel
          messages={messages}
          child={child}
          onSend={async ({ subject, body }) => {
            if (!child.academy_id) return { error: '학원 정보가 없습니다.' };
            return sendMessage({
              academy_id: child.academy_id,
              student_id: child.id,
              subject,
              body,
            });
          }}
        />
      )}
    </div>
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
  className,
}: {
  classId?: string | null;
  academyName: string;
  className?: string;
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

/** 접기 섹션 — 탭 전환 시 해당 데이터만 로딩 */
export function ParentPortalSecondaryPanels({ child, academyName }: Props) {
  const [tab, setTab] = useState<TabId>('attendance');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="추가 정보">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.id
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <i className={t.icon} aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'attendance' && <AttendanceTab studentId={child.id} />}
      {tab === 'reports' && <ReportsTab studentId={child.id} />}
      {tab === 'notices' && <NoticesTab studentId={child.id} classId={child.class_id} />}
      {tab === 'inquiry' && (
        <PortalSection id="inquiry" title="학부모 문의" description="실시간 채팅 또는 일회 문의를 선택하세요.">
          <InquiryTab child={child} />
        </PortalSection>
      )}
      {tab === 'payments' && <PaymentsTab studentId={child.id} />}
      {tab === 'schedule' && <ScheduleTab classId={child.class_id} academyName={academyName} />}
    </div>
  );
}
