'use client';

import Link from 'next/link';
import { StudentConnectionsPanel } from '@/components/student/StudentConnectionsPanel';
import { isParentLinked } from '@/lib/studentPortal';
import type { ParentEntity, ParentReport, Student } from '@/types/database';

export function StudentParentCommunication({
  student,
  studentId,
  parents,
  reports,
  pendingCardCount,
}: {
  student: Student;
  studentId: string;
  parents: ParentEntity[];
  reports: ParentReport[];
  pendingCardCount: number;
}) {
  const latestReport = reports[0];
  const latestParentMessage = parents[0];

  return (
    <section
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            Parent Communication
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            EduFlow 내부 학부모 소통 기록입니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/parent-hub" className="app-btn app-btn-secondary text-sm">
            <i className="ri-chat-3-line" />
            대화 열기
          </Link>
          <Link
            href={`/parent-reports?student=${studentId}`}
            className="app-btn app-btn-ghost text-sm"
          >
            <i className="ri-file-text-line" />
            리포트 보기
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)' }}>
          <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
            최근 전달 내용
          </p>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
            {latestReport
              ? `${latestReport.period_start} ~ ${latestReport.period_end} 리포트`
              : '전달된 리포트가 없습니다.'}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)' }}>
          <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
            최근 대화
          </p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--app-ink-2)' }}>
            {latestParentMessage
              ? `${latestParentMessage.name}${isParentLinked(student) ? ' · 포털 연결됨' : ''}`
              : '등록된 학부모가 없습니다.'}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)' }}>
          <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
            미확인 리포트
          </p>
          <p className="text-sm mt-1.5 font-semibold tabular-nums" style={{ color: 'var(--app-ink)' }}>
            {pendingCardCount > 0 ? `${pendingCardCount}건 대기` : '없음'}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--app-surface-2)' }}>
          <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--app-ink-4)' }}>
            다음 전달 예정
          </p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--app-ink-2)' }}>
            {pendingCardCount > 0
              ? '상담 카드 완료 후 학부모 전달'
              : '—'}
          </p>
        </div>
      </div>

      {parents.length > 0 && (
        <ul className="space-y-2">
          {parents.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--app-surface-2)' }}
            >
              <div>
                <span className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {p.name}
                </span>
                {p.phone && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--app-ink-3)' }}>
                    {p.phone}
                  </span>
                )}
              </div>
              {p.user_id ? (
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#f0fdf4', color: '#059669' }}
                >
                  연결됨
                </span>
              ) : (
                <span
                  className="text-[10px] px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--app-border)', color: 'var(--app-ink-3)' }}
                >
                  미연결
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <StudentConnectionsPanel student={student} variant="light" />
    </section>
  );
}
