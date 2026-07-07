'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStudent } from '@/hooks/useStudents';
import { useLessonLogs } from '@/hooks/useLessonLogs';
import { useConsultationCards } from '@/hooks/useConsultationCards';
import { useParentReports } from '@/hooks/useParentReports';
import { useConsultationFollowups } from '@/hooks/useConsultationFollowups';
import { useCounselingSessions } from '@/hooks/useCounselingSessions';
import { useRetention, REREGISTRATION_STATUS_LABELS } from '@/hooks/useRetention';
import { useStudentHub } from '@/hooks/useStudentHub';
import {
  calculateScoreTrend,
  calculateHomeworkTrend,
} from '@/lib/analytics';
import { buildStudentTimeline } from '@/lib/studentTimeline';
import { buildConsultationBriefing } from '@/lib/consultationBriefing';
import { HOMEWORK_LABELS, ATTENDANCE_LABELS } from '@/lib/statusLabels';
import { ErrorBanner, PageLoader, EmptyState } from '@/components/ui/DataStates';
import { countPendingConsultations } from '@/lib/consultationStatus';
import { assessStudentRisk } from '@/lib/studentRisk';
import { StudentDetailHero } from '@/components/student-detail/StudentDetailHero';
import { StudentOverviewRow } from '@/components/student-detail/StudentOverviewRow';
import { StudentActivityTimeline } from '@/components/student-detail/StudentActivityTimeline';
import {
  StudentRecentLessons,
  StudentLessonDrawer,
} from '@/components/student-detail/StudentRecentLessons';
import { StudentLearningTrend } from '@/components/student-detail/StudentLearningTrend';
import { StudentConsultationCenter } from '@/components/student-detail/StudentConsultationCenter';
import { StudentParentCommunication } from '@/components/student-detail/StudentParentCommunication';
import { StudentAiInsightFooter } from '@/components/student-detail/StudentAiInsightFooter';
import { StudentDetailSection } from '@/components/student-detail/StudentDetailSection';
import { StudentDetailSidebar } from '@/components/student-detail/StudentDetailSidebar';
import { StaffBreadcrumb } from '@/components/navigation/StaffBreadcrumb';
import type { LessonLog, Student } from '@/types/database';

export default function StudentDetail({
  studentId,
  embed = false,
  initialStudent = null,
}: {
  studentId: string;
  embed?: boolean;
  initialStudent?: Student | null;
}) {
  const [selectedLog, setSelectedLog] = useState<LessonLog | null>(null);
  const { student, loading: studentLoading, error: studentError, refetch } = useStudent(
    studentId,
    initialStudent
  );
  const { logs, loading: logsLoading, error: logsError } = useLessonLogs({ studentId, limit: 50 });
  const { cards } = useConsultationCards(studentId);
  const { reports } = useParentReports(studentId);
  const { followups } = useConsultationFollowups(studentId);
  const { sessions } = useCounselingSessions(studentId);
  const { signals: retentionSignals } = useRetention();
  const hub = useStudentHub(studentId);

  const analytics = useMemo(() => {
    if (!student || logs.length === 0) return null;
    const scoreTrend = calculateScoreTrend(logs);
    const hwTrend = calculateHomeworkTrend(logs);
    const timeline = buildStudentTimeline(logs, cards, reports, followups, sessions);
    const briefing = buildConsultationBriefing(student, logs, cards, followups);
    const pendingCardCount = countPendingConsultations(cards);
    return { scoreTrend, hwTrend, timeline, briefing, pendingCardCount };
  }, [student, logs, cards, reports, followups, sessions]);

  const attendanceRate = useMemo(() => {
    const recent = logs.slice(0, 12);
    if (recent.length === 0) return null;
    const ok = recent.filter(
      (l) => l.attendance_status === 'present' || l.attendance_status === 'late'
    ).length;
    return Math.round((ok / recent.length) * 100);
  }, [logs]);

  const cardPeriods = useMemo(
    () => new Set(cards.map((c) => c.period_start.slice(0, 7))),
    [cards]
  );

  const riskAssessment = useMemo(
    () => (logs.length > 0 ? assessStudentRisk(logs, { followups }) : null),
    [logs, followups]
  );

  const aiInsightLines = useMemo(() => {
    const lines: string[] = [];
    if (analytics?.hwTrend.recentRate != null && analytics.hwTrend.recentRate < 70) {
      lines.push('최근 숙제 제출률이 감소했습니다.');
    }
    if (analytics?.scoreTrend.direction === 'down') {
      lines.push('출석은 안정적이지만 성적 하락이 있습니다.');
    } else if (attendanceRate != null && attendanceRate >= 80) {
      lines.push('출석은 안정적으로 유지되고 있습니다.');
    }
    if (riskAssessment?.kind === 'attention' || riskAssessment?.kind === 'consultation') {
      lines.push('상담 시 학습 동기 관련 대화를 권장합니다.');
    }
    for (const line of analytics?.briefing.lines ?? []) {
      if (lines.length >= 5) break;
      if (!lines.includes(line)) lines.push(line);
    }
    return lines;
  }, [analytics, attendanceRate, riskAssessment]);

  if (studentLoading) return <PageLoader />;
  if (studentError) return <ErrorBanner message={studentError} onRetry={refetch} />;
  if (!student) return <EmptyState title="학생을 찾을 수 없습니다" />;

  const enrollmentClass =
    (hub.enrollment?.classes as { name?: string } | undefined)?.name ??
    (student.classes as { name?: string })?.name ??
    '반 미지정';
  const enrollmentGrade =
    (hub.enrollment?.classes as { grade?: string } | undefined)?.grade ?? student.grade;

  const recentLessons = logs.slice(0, 6);
  const latestLog = logs[0];
  const latestCard = cards[0];
  const latestReport = reports[0];
  const reregLabel = hub.reregistration
    ? REREGISTRATION_STATUS_LABELS[hub.reregistration.status] ?? hub.reregistration.status
    : '미등록';

  const retentionSignal =
    hub.riskSnapshots.find((s) => s.snapshot_type === 'retention') ??
    retentionSignals.find((s) => s.student_id === studentId);

  return (
    <div className="w-full min-w-0 max-w-7xl pb-12">
      {!embed && (
        <StaffBreadcrumb
          items={[
            { label: '학생', href: '/students' },
            { label: student.name },
          ]}
        />
      )}

      {logsError && <ErrorBanner message={logsError} />}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-10 min-w-0">
      <StudentDetailHero
        student={student}
        grade={enrollmentGrade}
        className={enrollmentClass}
        teacherName={hub.homeroomTeacher}
        attendanceRate={attendanceRate}
        avgScore={analytics?.scoreTrend.recentAvg ?? null}
        reregStatus={reregLabel}
        risk={riskAssessment}
        studentId={studentId}
        briefing={analytics?.briefing ?? null}
      />

      <StudentOverviewRow
        recentAttendance={
          latestLog ? ATTENDANCE_LABELS[latestLog.attendance_status] : '기록 없음'
        }
        recentHomework={latestLog ? HOMEWORK_LABELS[latestLog.homework_status] : '—'}
        recentScore={
          latestLog?.test_score != null ? `${latestLog.test_score}점` : '—'
        }
        recentCounseling={
          latestCard
            ? `${latestCard.period_start} ~ ${latestCard.period_end}`
            : '없음'
        }
        recentParent={
          latestReport
            ? latestReport.created_at.slice(0, 10)
            : '없음'
        }
        reregLabel={reregLabel}
        attendanceDetail={
          logs.length > 0
            ? logs
                .slice(0, 5)
                .map((l) => `${l.lesson_date} ${ATTENDANCE_LABELS[l.attendance_status]}`)
                .join('\n')
            : undefined
        }
        homeworkDetail={
          logs.length > 0
            ? logs
                .slice(0, 5)
                .map((l) => `${l.lesson_date} ${HOMEWORK_LABELS[l.homework_status]}`)
                .join('\n')
            : undefined
        }
        scoreDetail={
          logs.filter((l) => l.test_score != null).length > 0
            ? logs
                .filter((l) => l.test_score != null)
                .slice(0, 5)
                .map((l) => `${l.lesson_date} ${l.test_score}점 (${l.unit})`)
                .join('\n')
            : undefined
        }
      />

      <StudentDetailSection
        title="활동 타임라인"
        description="수업·출결·상담·학부모 전달이 시간순으로 연결됩니다."
      >
        {analytics ? (
          <StudentActivityTimeline entries={analytics.timeline} />
        ) : (
          <StudentActivityTimeline entries={[]} />
        )}
      </StudentDetailSection>

      <StudentDetailSection
        id="recent-lessons"
        title="최근 수업"
        description="카드를 눌러 수업 상세를 확인하세요."
      >
        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="app-skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <StudentRecentLessons
            logs={recentLessons}
            cardPeriods={cardPeriods}
            onSelect={setSelectedLog}
          />
        )}
      </StudentDetailSection>

      <StudentLearningTrend
        logs={logs}
        scoreTrend={analytics?.scoreTrend ?? { direction: 'insufficient', recentAvg: null, previousAvg: null, delta: null, points: [] }}
        hwTrend={analytics?.hwTrend ?? { direction: 'insufficient', recentRate: 0, previousRate: 0, weeklyRates: [] }}
      />

      <StudentConsultationCenter
        studentId={studentId}
        logs={logs}
        cards={cards}
        followups={followups}
        sessions={sessions}
        briefing={analytics?.briefing ?? { headline: student.name, lines: [], kindLabel: '안정' }}
        risk={riskAssessment}
        pendingCardCount={analytics?.pendingCardCount ?? 0}
      />

      {retentionSignal && (
        <div className="rounded-xl px-4 py-3 text-sm app-banner-danger">
          <span className="font-semibold">재등록 신호: </span>
          {retentionSignal.reason}
          <Link
            href="/students?filter=at-risk"
            className="ml-2 text-xs font-medium underline"
            style={{ color: 'var(--app-danger)' }}
          >
            위험 학생 목록 →
          </Link>
        </div>
      )}

      <StudentParentCommunication
        student={student}
        studentId={studentId}
        parents={hub.parents}
        reports={reports}
        pendingCardCount={analytics?.pendingCardCount ?? 0}
      />

      <StudentAiInsightFooter lines={aiInsightLines} />
        </div>

        <div className="xl:col-span-4 min-w-0">
          <StudentDetailSidebar
            student={student}
            studentId={studentId}
            parents={hub.parents}
            sessions={sessions}
            recentLessons={recentLessons}
            className={enrollmentClass}
          />
        </div>
      </div>

      <StudentLessonDrawer
        log={selectedLog}
        hasAiSummary={
          selectedLog ? cardPeriods.has(selectedLog.lesson_date.slice(0, 7)) : false
        }
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
