'use client';

import { useState } from 'react';
import { WorkspaceSection } from '@/components/lesson-logs/WorkspaceSection';
import { StudentRecordingCard } from '@/components/lesson-logs/StudentRecordingCard';
import { LessonCloseFollowUpDrawer } from '@/components/lesson-logs/LessonCloseFollowUpDrawer';
import { mergeLessonFormRow, type LessonFormRow } from '@/lib/lessonLogRowDefaults';
import { lessonInputStyle } from '@/components/lesson-logs/lessonLogConstants';
import { formatSavedAt } from '@/lib/formatSavedAt';
import { cn } from '@/lib/cn';
import type { AttendanceStatus, HomeworkStatus, Student } from '@/types/database';

type Props = {
  students: Student[];
  rows: Record<string, LessonFormRow>;
  formDisabled: boolean;
  lastHomework: { title: string; date: string } | null;
  homeworkNote: string;
  onHomeworkNoteChange: (v: string) => void;
  lessonClosed: boolean;
  savingHeader: boolean;
  headerSavedAt?: number | null;
  onSaveHeader: () => void;
  onMarkAllPresent: () => void;
  onMarkAllHomeworkComplete: () => void;
  onUpdateRow: (
    studentId: string,
    field: keyof LessonFormRow,
    value: LessonFormRow[keyof LessonFormRow]
  ) => void;
  autoSaving: Record<string, boolean>;
  rowSavedAt?: Record<string, number>;
  attendanceOptions: { value: AttendanceStatus; label: string }[];
  homeworkOptions: { value: HomeworkStatus; label: string }[];
  lessonInProgress: boolean;
  isOwner: boolean;
  closing: boolean;
  reopening: boolean;
  onCloseLesson: () => void;
  onReopenLesson: () => void;
  selectedClassId: string;
  date: string;
};

function RecordingSummary({
  students,
  rows,
}: {
  students: Student[];
  rows: Record<string, LessonFormRow>;
}) {
  const present = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'present').length;
  const late = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'late').length;
  const absent = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'absent').length;
  const hwDone = students.filter((s) => mergeLessonFormRow(rows[s.id]).homework === 'complete').length;
  const hwMissing = students.filter((s) => mergeLessonFormRow(rows[s.id]).homework === 'missing').length;
  const scored = students.filter((s) => {
    const v = mergeLessonFormRow(rows[s.id]).score;
    return v !== '' && v != null;
  }).length;

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm"
      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
    >
      <span className="text-[11px] font-bold uppercase tracking-wide mr-1" style={{ color: 'var(--app-ink-4)' }}>
        현황
      </span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        출석 <strong className="app-text-info">{present}</strong>
        {late > 0 && <> · 지각 <strong className="app-text-warning">{late}</strong></>}
        {absent > 0 && <> · 결석 <strong className="app-text-danger">{absent}</strong></>}
      </span>
      <span style={{ color: 'var(--app-border)' }}>·</span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        숙제완료 <strong className="app-text-success">{hwDone}</strong>
        {hwMissing > 0 && <> · 미제출 <strong className="app-text-danger">{hwMissing}</strong></>}
      </span>
      <span style={{ color: 'var(--app-border)' }}>·</span>
      <span style={{ color: 'var(--app-ink-3)' }}>
        점수 <strong style={{ color: 'var(--app-ink)' }}>{scored}</strong>/{students.length}명
      </span>
    </div>
  );
}

export function LessonRecordingSection({
  students,
  rows,
  formDisabled,
  lastHomework,
  homeworkNote,
  onHomeworkNoteChange,
  lessonClosed,
  savingHeader,
  headerSavedAt,
  onSaveHeader,
  onMarkAllPresent,
  onMarkAllHomeworkComplete,
  onUpdateRow,
  autoSaving,
  rowSavedAt,
  attendanceOptions,
  homeworkOptions,
  lessonInProgress,
  isOwner,
  closing,
  reopening,
  onCloseLesson,
  onReopenLesson,
  selectedClassId,
  date,
}: Props) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const inputStyle = (disabled: boolean) => lessonInputStyle(disabled);
  const absentStudents = students.filter((s) => mergeLessonFormRow(rows[s.id]).attendance === 'absent');
  const missingHomeworkStudents = students.filter(
    (s) => mergeLessonFormRow(rows[s.id]).homework === 'missing'
  );

  return (
    <div className="space-y-5" style={{ opacity: formDisabled ? 0.85 : 1 }}>
      <RecordingSummary students={students} rows={rows} />

      <WorkspaceSection title="학생 기록" description="학생마다 출결·숙제·점수·메모를 한 카드에서 입력합니다">
        {!formDisabled && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={onMarkAllPresent} className="app-btn app-btn-secondary app-btn-sm">
              <i className="ri-checkbox-multiple-line" />
              전원 출석
            </button>
            <button type="button" onClick={onMarkAllHomeworkComplete} className="app-btn app-btn-secondary app-btn-sm">
              <i className="ri-checkbox-multiple-line" />
              전원 숙제 완료
            </button>
          </div>
        )}

        {lastHomework && (
          <div
            className="rounded-xl px-4 py-3 mb-4"
            style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--app-ink-4)' }}>
              지난 숙제 ({lastHomework.date})
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--app-ink)' }}>
              {lastHomework.title}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {students.map((student) => {
            const row = mergeLessonFormRow(rows[student.id]);
            return (
              <StudentRecordingCard
                key={student.id}
                student={student}
                row={row}
                disabled={formDisabled}
                saving={autoSaving[student.id]}
                savedAt={rowSavedAt?.[student.id]}
                inputStyle={inputStyle(formDisabled)}
                attendanceOptions={attendanceOptions}
                homeworkOptions={homeworkOptions}
                onUpdate={(field, value) => onUpdateRow(student.id, field, value)}
              />
            );
          })}
        </div>

        <div
          className="mt-5 pt-4 border-t rounded-xl px-3 py-3 -mx-1"
          style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)' }}
        >
          <div className="flex flex-wrap items-end justify-between gap-2 mb-1.5">
            <label className="app-label">
              <i className="ri-book-2-line mr-1" />
              오늘 내줄 숙제
              <span className="ml-2 text-[10px] font-normal normal-case" style={{ color: 'var(--app-ink-4)' }}>
                자동 저장
              </span>
            </label>
            <span className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>
              {savingHeader ? '저장 중…' : formatSavedAt(headerSavedAt) ? `저장됨 · ${formatSavedAt(headerSavedAt)}` : ''}
            </span>
          </div>
          <input
            type="text"
            value={homeworkNote}
            disabled={lessonClosed}
            onChange={(e) => onHomeworkNoteChange(e.target.value)}
            onBlur={() => {
              if (!lessonClosed && homeworkNote.trim()) onSaveHeader();
            }}
            placeholder="예: p.45 예제 1~10번"
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={inputStyle(lessonClosed)}
          />
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--app-ink-4)' }}>
            입력 후 잠시 기다리면 자동 저장됩니다. 학부모·학원 포털에 표시됩니다.
          </p>
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="수업 마감" description="기록을 마친 뒤 수업을 마감합니다">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
            {lessonInProgress
              ? '출결·숙제·점수·메모 입력이 끝나면 마감하세요.'
              : lessonClosed
                ? '수업이 마감되었습니다.'
                : '수업을 시작한 뒤 기록을 입력할 수 있습니다.'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {lessonInProgress && (
              <button
                type="button"
                disabled={closing}
                onClick={onCloseLesson}
                className="app-btn disabled:opacity-50"
                style={{ background: 'var(--app-ink)', color: 'var(--app-on-accent)', borderColor: 'transparent' }}
              >
                {closing ? '마감 중…' : '수업 마감'}
              </button>
            )}
            {lessonClosed && isOwner && (
              <button
                type="button"
                disabled={reopening}
                onClick={onReopenLesson}
                className="app-btn app-btn-ghost disabled:opacity-50"
              >
                {reopening ? '열기 중…' : '다시 열기'}
              </button>
            )}
          </div>
        </div>
      </WorkspaceSection>

      {lessonClosed && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            boxShadow: 'var(--s-sm)',
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--app-ink-4)' }}>
              수업 마감 완료
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
              다음 단계를 확인하세요.
            </p>
            <button
              type="button"
              onClick={() => setFollowUpOpen(true)}
              className="mt-2 app-btn app-btn-primary app-btn-sm"
            >
              후속 작업 패널 열기
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                action: () => setFollowUpOpen(true),
                step: 'makeup' as const,
                icon: 'ri-calendar-check-line',
                iconBg: 'var(--app-warning-bg)',
                iconColor: 'var(--app-warning)',
                title: '결석자 보강',
                desc:
                  absentStudents.length > 0
                    ? `${absentStudents.map((s) => s.name).join(', ')} · ${absentStudents.length}명`
                    : '결석자 없음',
              },
              {
                action: () => setFollowUpOpen(true),
                step: 'consultation' as const,
                icon: 'ri-chat-check-line',
                iconBg: 'var(--avatar-3-bg)',
                iconColor: 'var(--avatar-3-text)',
                title: '상담 카드 작성',
                desc: 'AI 상담 준비 및 학부모 전달',
              },
              {
                action: () => setFollowUpOpen(true),
                step: 'report' as const,
                icon: 'ri-file-text-line',
                iconBg: 'var(--avatar-4-bg)',
                iconColor: 'var(--avatar-4-text)',
                title: '학부모 전달',
                desc:
                  missingHomeworkStudents.length > 0
                    ? `미제출 ${missingHomeworkStudents.length}명 포함 확인`
                    : '학부모 리포트 보내기',
              },
            ].map(({ action, icon, iconBg, iconColor, title, desc }) => (
              <button
                key={title}
                type="button"
                onClick={action}
                className="flex items-start gap-3 rounded-xl p-4 transition-all hover:shadow-[var(--s-md)] text-left w-full"
                style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
              >
                <span
                  className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: iconBg }}
                >
                  <i className={cn(icon, 'text-base')} style={{ color: iconColor }} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <LessonCloseFollowUpDrawer
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        absentStudents={absentStudents}
        missingHomeworkStudents={missingHomeworkStudents}
        selectedClassId={selectedClassId}
        date={date}
      />
    </div>
  );
}
