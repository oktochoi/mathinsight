'use client';

import Link from 'next/link';
import { STATUS_LABELS } from '@/lib/statusLabels';
import type { Student } from '@/types/database';
import type { StudentRiskAssessment } from '@/lib/studentRisk';
import { cn } from '@/lib/cn';

function signalMeta(
  status: Student['status'],
  risk: StudentRiskAssessment | null
): { label: string; tone: 'ok' | 'watch' | 'risk' } {
  if (risk?.kind === 'consultation') {
    return { label: '상담 권장', tone: 'risk' };
  }
  if (risk?.kind === 'makeup') {
    return { label: '보강 권장', tone: 'risk' };
  }
  if (status === 'consultation') {
    return { label: '상담 권장', tone: 'risk' };
  }
  if (status === 'attention' || risk?.kind === 'attention') {
    return { label: '보강 권장', tone: 'watch' };
  }
  if (risk?.kind === 'recovering') {
    return { label: '회복 중', tone: 'watch' };
  }
  return { label: '양호', tone: 'ok' };
}

export function StudentDetailHero({
  student,
  grade,
  className,
  teacherName,
  attendanceRate,
  avgScore,
  reregStatus,
  risk,
  studentId,
}: {
  student: Student;
  grade: string;
  className: string;
  teacherName: string | null;
  attendanceRate: number | null;
  avgScore: number | null;
  reregStatus: string | null;
  risk: StudentRiskAssessment | null;
  studentId: string;
}) {
  const signal = signalMeta(student.status, risk);

  return (
    <header
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div
            className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center text-xs font-medium text-center px-2"
            style={{
              background: 'var(--app-surface-2)',
              border: '1px dashed var(--app-border)',
              color: 'var(--app-ink-4)',
            }}
          >
            {student.name.slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
                >
                  {student.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
                  {grade} · {className}
                  {teacherName ? ` · ${teacherName}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {signal.tone !== 'ok' ? (
                  <a
                    href="#consultation"
                    className={cn(
                      'text-xs font-semibold px-3 py-1.5 rounded-full border hover:opacity-90 transition-opacity',
                      signal.tone === 'watch' && 'bg-amber-50 text-amber-900 border-amber-200',
                      signal.tone === 'risk' && 'bg-rose-50 text-rose-800 border-rose-200'
                    )}
                  >
                    {signal.label} →
                  </a>
                ) : (
                  <span
                    className={cn(
                      'text-xs font-semibold px-3 py-1.5 rounded-full border',
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    )}
                  >
                    {signal.label}
                  </span>
                )}
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
                >
                  {STATUS_LABELS[student.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                  출석률
                </p>
                <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--app-ink)' }}>
                  {attendanceRate != null ? `${attendanceRate}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                  평균 점수
                </p>
                <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--app-ink)' }}>
                  {avgScore != null ? `${avgScore}점` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                  재등록
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--app-ink)' }}>
                  {reregStatus ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                  현재 신호
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--app-ink)' }}>
                  {risk?.kindLabel ?? signal.label}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/counseling?step=session&student=${studentId}`}
                className="app-btn app-btn-primary text-sm"
              >
                <i className="ri-chat-smile-3-line" />
                상담 시작
              </Link>
              <Link href="/parent-hub" className="app-btn app-btn-secondary text-sm">
                <i className="ri-parent-line" />
                학부모 대화
              </Link>
              <a href="#recent-lessons" className="app-btn app-btn-ghost text-sm">
                <i className="ri-book-open-line" />
                최근 수업 보기
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
