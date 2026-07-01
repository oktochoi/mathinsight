'use client';

import type { HomeworkAssignment, HomeworkSubmission, LessonLog } from '@/types/database';

const SUGGESTED = [
  '요즘 숙제를 잘 해오나요?',
  '이번 달 수업 흐름이 어때요?',
  '어떤 부분을 더 신경 써야 할까요?',
] as const;

type AssignmentRow = HomeworkAssignment & { submission?: HomeworkSubmission };

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
  pendingAssignments: AssignmentRow[];
  onAsk: (q: string) => void;
}) {
  const displayLog = todayLog ?? latestLog;
  if (!displayLog && pendingAssignments.length === 0) return null;

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{
          background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)',
          borderColor: 'var(--app-border)',
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: 'var(--app-ink-4)' }}
        >
          {today}
        </p>
        <p className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>
          {studentName} 학생 오늘
        </p>
      </div>

      <div className="px-5 py-4 space-y-2">
        {displayLog?.attendance_status && (
          <Row
            icon="ri-checkbox-circle-line"
            iconColor={displayLog.attendance_status === 'present' ? '#10b981' : '#ef4444'}
            label="출결"
            value={displayLog.attendance_status === 'present' ? '출석' : '결석'}
          />
        )}
        {displayLog?.memo?.trim() && (
          <Row
            icon="ri-chat-quote-line"
            iconColor="#6366f1"
            label="선생님 메모"
            value={`"${displayLog.memo.trim()}"`}
            highlight
          />
        )}
        {displayLog?.homework_status && (
          <Row
            icon="ri-book-2-line"
            iconColor={displayLog.homework_status === 'missing' ? '#ef4444' : '#f59e0b'}
            label="숙제"
            value={displayLog.homework_status === 'missing' ? '미제출' : '제출'}
          />
        )}
        {displayLog?.test_score != null && (
          <Row
            icon="ri-bar-chart-box-line"
            iconColor="#2563eb"
            label="점수"
            value={`${displayLog.test_score}점`}
          />
        )}
        {pendingAssignments[0] && (
          <Row
            icon="ri-task-line"
            iconColor="#d97706"
            label="다음 숙제"
            value={pendingAssignments[0].title}
          />
        )}
      </div>

      <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--app-border)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--app-ink-3)' }}>
          AI에게 더 물어보기
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAsk(q)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-blue-50 cursor-pointer"
              style={{
                borderColor: 'var(--app-accent)',
                color: 'var(--app-accent)',
                background: 'white',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  iconColor,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${highlight ? 'bg-indigo-50' : ''}`}
    >
      <i className={`${icon} text-base shrink-0 mt-0.5`} style={{ color: iconColor }} />
      <div>
        <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--app-ink-4)' }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: 'var(--app-ink)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}
