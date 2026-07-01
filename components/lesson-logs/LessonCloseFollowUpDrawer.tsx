'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { Student } from '@/types/database';

type StepId = 'makeup' | 'consultation' | 'report' | 'progress';

type Props = {
  open: boolean;
  onClose: () => void;
  absentStudents: Student[];
  missingHomeworkStudents: Student[];
  selectedClassId: string;
  date: string;
};

const STEPS: { id: StepId; icon: string; title: string }[] = [
  { id: 'makeup', icon: 'ri-calendar-check-line', title: '결석자 보강' },
  { id: 'progress', icon: 'ri-book-open-line', title: '다음 단원' },
  { id: 'consultation', icon: 'ri-chat-check-line', title: '상담 카드' },
  { id: 'report', icon: 'ri-file-text-line', title: '학부모 전달' },
];

export function LessonCloseFollowUpDrawer({
  open,
  onClose,
  absentStudents,
  missingHomeworkStudents,
  selectedClassId,
  date,
}: Props) {
  const [step, setStep] = useState<StepId>('makeup');
  const [done, setDone] = useState<Set<StepId>>(new Set());

  if (!open) return null;

  const toggleDone = (id: StepId) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <button type="button" aria-label="닫기" className="app-overlay" onClick={onClose} />
      <aside className="app-drawer max-w-lg">
        <header className="app-drawer-header">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--app-ink-4)' }}>
              수업 마감 후속
            </p>
            <h2 className="text-xl font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>
              다음 단계
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--app-surface-2)]"
            style={{ color: 'var(--app-ink-3)' }}
          >
            <i className="ri-close-line text-xl" />
          </button>
        </header>

        <div className="app-drawer-body space-y-5">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--app-surface-2)' }}>
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  'flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all',
                  step === s.id ? 'shadow-sm' : ''
                )}
                style={
                  step === s.id
                    ? { background: 'var(--app-surface)', color: 'var(--app-ink)' }
                    : { color: 'var(--app-ink-3)' }
                }
              >
                {done.has(s.id) && <i className="ri-check-line mr-0.5 text-emerald-600" />}
                {s.title}
              </button>
            ))}
          </div>

          {step === 'makeup' && (
            <section className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
                {absentStudents.length > 0
                  ? `결석 ${absentStudents.length}명 — 보강 일정을 잡아 주세요.`
                  : '오늘 결석자가 없습니다.'}
              </p>
              {absentStudents.length > 0 && (
                <ul className="text-sm space-y-1" style={{ color: 'var(--app-ink)' }}>
                  {absentStudents.map((s) => (
                    <li key={s.id}>· {s.name}</li>
                  ))}
                </ul>
              )}
              <Link
                href={`/schedule?class=${selectedClassId}&date=${date}&action=makeup`}
                className="app-btn app-btn-primary w-full text-center"
              >
                시간표에서 보강 예약
              </Link>
            </section>
          )}

          {step === 'progress' && (
            <section className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
                수업을 마쳤다면 반 진도를 다음 단원으로 옮길 수 있습니다.
              </p>
              <Link
                href={`/curriculum${selectedClassId ? `?class=${selectedClassId}` : ''}`}
                className="app-btn app-btn-primary w-full text-center"
              >
                커리큘럼에서 진도 확인
              </Link>
            </section>
          )}

          {step === 'consultation' && (
            <section className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
                AI 상담 카드를 작성하고 학부모에게 전달할 수 있습니다.
              </p>
              <Link
                href={`/consultation-cards${selectedClassId ? `?class=${selectedClassId}` : ''}`}
                className="app-btn app-btn-primary w-full text-center"
              >
                상담 카드 작성
              </Link>
            </section>
          )}

          {step === 'report' && (
            <section className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
                {missingHomeworkStudents.length > 0
                  ? `숙제 미제출 ${missingHomeworkStudents.length}명 — 학부모 리포트를 확인하세요.`
                  : '학부모 리포트를 보낼 수 있습니다.'}
              </p>
              <Link href="/parent-reports" className="app-btn app-btn-primary w-full text-center">
                학부모 전달 열기
              </Link>
            </section>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--app-ink-3)' }}>
            <input
              type="checkbox"
              checked={done.has(step)}
              onChange={() => toggleDone(step)}
              className="rounded"
            />
            이 단계 완료로 표시
          </label>
        </div>
      </aside>
    </>
  );
}
