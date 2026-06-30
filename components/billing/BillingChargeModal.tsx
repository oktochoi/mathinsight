'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ClassRow } from '@/types/database';

const INPUT_STYLE = { border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' };

export function BillingChargeModal({
  open,
  classes,
  students,
  onClose,
  onBulkClass,
  onBulkStudents,
}: {
  open: boolean;
  classes: ClassRow[];
  students: { id: string; name: string; grade: string; class_id: string | null }[];
  onClose: () => void;
  onBulkClass: (
    classId: string,
    title: string,
    amount: number,
    dueDate: string,
    billingMonth: string
  ) => Promise<void>;
  onBulkStudents: (
    studentIds: string[],
    title: string,
    amount: number,
    dueDate: string,
    billingMonth: string
  ) => Promise<void>;
}) {
  const [mode, setMode] = useState<'class' | 'students'>('class');
  const [classId, setClassId] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const reset = () => {
    setTitle('');
    setAmount('');
    setDueDate('');
    setBillingMonth('');
    setPicked([]);
    setClassId('');
  };

  const submit = async () => {
    if (!title.trim() || !amount || !dueDate) return;
    setBusy(true);
    if (mode === 'class' && classId) {
      await onBulkClass(classId, title, parseInt(amount, 10), dueDate, billingMonth);
    } else if (mode === 'students' && picked.length > 0) {
      await onBulkStudents(picked, title, parseInt(amount, 10), dueDate, billingMonth);
    }
    setBusy(false);
    reset();
    onClose();
  };

  const canSubmit =
    title.trim() &&
    amount &&
    dueDate &&
    !busy &&
    ((mode === 'class' && classId) || (mode === 'students' && picked.length > 0));

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl mx-4 overflow-hidden" style={{ background: 'var(--app-surface)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--app-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--app-ink)' }}>수강료 청구 등록</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-3)' }}>반 전체 또는 학생을 선택해 일괄 등록합니다.</p>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex rounded-lg p-0.5" style={{ border: '1px solid var(--app-border)' }}>
            {(
              [
                ['class', '반 전체'],
                ['students', '학생 선택'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className="flex-1 py-2 text-sm font-semibold rounded-md"
                style={
                  mode === key
                    ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)' }
                    : { color: 'var(--app-ink-3)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'class' ? (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={INPUT_STYLE}
            >
              <option value="">반 선택</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-xl divide-y divide-[var(--app-border)]" style={{ border: '1px solid var(--app-border)' }}>
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={picked.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setPicked((ids) => [...ids, s.id]);
                      else setPicked((ids) => ids.filter((id) => id !== s.id));
                    }}
                  />
                  {s.name} <span style={{ color: 'var(--app-ink-4)' }}>{s.grade}</span>
                </label>
              ))}
            </div>
          )}

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="청구명 (예: 6월 수강료)"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={INPUT_STYLE}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="금액 (원)"
              className="rounded-xl px-3 py-2.5 text-sm"
              style={INPUT_STYLE}
            />
            <input
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="청구월 (2026-06)"
              className="rounded-xl px-3 py-2.5 text-sm"
              style={INPUT_STYLE}
            />
          </div>
          <label className="block text-sm" style={{ color: 'var(--app-ink-2)' }}>
            납부 기한
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              style={INPUT_STYLE}
            />
          </label>
        </div>
        <div className="px-6 py-4 flex gap-2 justify-end" style={{ borderTop: '1px solid var(--app-border)' }}>
          <button type="button" onClick={onClose} className="app-btn app-btn-ghost">
            취소
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="app-btn app-btn-primary disabled:opacity-50"
          >
            청구 등록
          </button>
        </div>
      </div>
    </>
  );
}
