'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { formatPhoneDisplay } from '@/lib/phone';
import type { CounselingSession, LessonLog, ParentEntity, Student } from '@/types/database';

export function StudentDetailSidebar({
  student,
  studentId,
  parents,
  sessions,
  recentLessons,
  className: classLabel,
}: {
  student: Student;
  studentId: string;
  parents: ParentEntity[];
  sessions: CounselingSession[];
  recentLessons: LessonLog[];
  className: string;
}) {
  const { students } = useStudents();

  const classmates = useMemo(() => {
    if (!student.class_id) return [];
    return students
      .filter((s) => s.class_id === student.class_id && s.id !== studentId)
      .slice(0, 8);
  }, [student.class_id, studentId, students]);

  const upcomingSessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions
      .filter((s) => s.scheduled_at && s.scheduled_at.slice(0, 10) >= today)
      .sort((a, b) => (a.scheduled_at ?? '').localeCompare(b.scheduled_at ?? ''))
      .slice(0, 3);
  }, [sessions]);

  const memoHighlights = useMemo(() => {
    return recentLessons
      .filter((l) => l.memo?.trim() || (l.tags?.length ?? 0) > 0)
      .slice(0, 3)
      .map((l) => ({
        date: l.lesson_date,
        text: l.memo?.trim() || l.tags.join(', '),
      }));
  }, [recentLessons]);

  const nextLesson = recentLessons[0];

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <SidebarCard title="학부모 연락">
        {parents.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
            등록된 학부모가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {parents.slice(0, 3).map((p) => (
              <li key={p.id} className="text-sm">
                <p className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {p.name}
                </p>
                {p.phone && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    {formatPhoneDisplay(p.phone)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/messages?student=${studentId}`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--app-accent)' }}
        >
          학부모 대화 열기
          <i className="ri-arrow-right-line" aria-hidden />
        </Link>
      </SidebarCard>

      <SidebarCard title="다가오는 일정">
        {upcomingSessions.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {upcomingSessions.map((s) => (
              <li key={s.id}>
                <p className="font-medium" style={{ color: 'var(--app-ink)' }}>
                  {s.scheduled_at?.slice(0, 16).replace('T', ' ')}
                </p>
                <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                  상담 예정
                </p>
              </li>
            ))}
          </ul>
        ) : nextLesson ? (
          <p className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
            최근 수업: <strong>{nextLesson.lesson_date}</strong>
            {nextLesson.unit ? ` · ${nextLesson.unit}` : ''}
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
            예정된 상담·수업 일정이 없습니다.
          </p>
        )}
      </SidebarCard>

      {memoHighlights.length > 0 && (
        <SidebarCard title="최근 메모">
          <ul className="space-y-2">
            {memoHighlights.map((m) => (
              <li key={m.date} className="text-sm">
                <p className="text-[11px] font-medium" style={{ color: 'var(--app-ink-4)' }}>
                  {m.date}
                </p>
                <p className="line-clamp-2" style={{ color: 'var(--app-ink-2)' }}>
                  {m.text}
                </p>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {classmates.length > 0 && (
        <SidebarCard title={`${classLabel} 학생`}>
          <ul className="space-y-1">
            {classmates.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/students/${c.id}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--app-accent)' }}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}
    </aside>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-4"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--app-ink-4)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}
