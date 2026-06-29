'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ClassRow } from '@/types/database';

type BulkMode = 'class' | 'selected' | 'due' | 'copy' | null;

const INPUT_STYLE = { border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' };

export function BillingBulkActions({
  classes,
  students,
  selectedCount,
  selectedPaymentId,
  onBulkClass,
  onBulkSelected,
  onCopy,
  onChangeDueDate,
  onSendSms,
  onSendKakao,
}: {
  classes: ClassRow[];
  students: { id: string; name: string; grade: string; class_id: string | null }[];
  selectedCount: number;
  selectedPaymentId: string | null;
  onBulkClass: (classId: string, title: string, amount: number, dueDate: string, billingMonth: string) => Promise<void>;
  onBulkSelected: (studentIds: string[], title: string, amount: number, dueDate: string, billingMonth: string) => Promise<void>;
  onCopy: (paymentId: string, dueDate: string) => Promise<void>;
  onChangeDueDate: (dueDate: string) => Promise<void>;
  onSendSms: () => Promise<void>;
  onSendKakao: () => Promise<void>;
}) {
  const [mode, setMode] = useState<BulkMode>(null);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode(null);
    setTitle('');
    setAmount('');
    setDueDate('');
    setBillingMonth('');
    setSelectedStudentIds([]);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
    reset();
  };

  const actions = [
    { id: 'class' as const, label: '반 전체 청구', icon: 'ri-group-line' },
    { id: 'selected' as const, label: '선택 학생 청구', icon: 'ri-user-add-line' },
    { id: 'copy' as const, label: '청구 복사', icon: 'ri-file-copy-line' },
    { id: 'due' as const, label: '납부기한 변경', icon: 'ri-calendar-line' },
    { id: 'sms' as const, label: '문자 보내기', icon: 'ri-message-2-line' },
    { id: 'kakao' as const, label: '카카오 알림', icon: 'ri-chat-3-line' },
  ];

  return (
    <section className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}>
      <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>빠른 일괄 작업</h2>
      <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--app-ink-3)' }}>
        반·학생 단위 청구와 알림을 한곳에서 처리합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              if (a.id === 'sms') void run(onSendSms);
              else if (a.id === 'kakao') void run(onSendKakao);
              else setMode(a.id === 'due' ? 'due' : a.id);
            }}
            disabled={busy || (a.id === 'copy' && !selectedPaymentId) || (a.id === 'due' && selectedCount === 0)}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium transition-colors',
              (a.id === 'copy' && !selectedPaymentId) || (a.id === 'due' && selectedCount === 0)
                ? 'opacity-40 cursor-not-allowed'
                : ''
            )}
            style={
              mode === a.id
                ? { background: 'var(--app-ink)', color: '#fff', border: '1px solid var(--app-ink)' }
                : { background: 'var(--app-surface)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' }
            }
          >
            <i className={a.icon} />
            {a.label}
          </button>
        ))}
      </div>

      {mode === 'class' && (
        <div className="mt-4 pt-4 grid sm:grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--app-border)' }}>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={INPUT_STYLE}
          >
            <option value="">반 선택</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="청구명"
            className="rounded-xl px-3 py-2 text-sm"
            style={INPUT_STYLE}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="금액"
            className="rounded-xl px-3 py-2 text-sm"
            style={INPUT_STYLE}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={INPUT_STYLE}
          />
          <input
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            placeholder="청구 월 (2026-05)"
            className="rounded-xl px-3 py-2 text-sm sm:col-span-2"
            style={INPUT_STYLE}
          />
          <div className="sm:col-span-2 flex gap-2">
            <button
              type="button"
              disabled={busy || !classId || !title || !amount || !dueDate}
              onClick={() =>
                void run(() =>
                  onBulkClass(classId, title, parseInt(amount, 10), dueDate, billingMonth)
                )
              }
              className="app-btn app-btn-primary disabled:opacity-50"
            >
              반 전체 청구 실행
            </button>
            <button type="button" onClick={reset} className="app-btn app-btn-ghost">
              취소
            </button>
          </div>
        </div>
      )}

      {mode === 'selected' && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--app-border)' }}>
          <div className="max-h-32 overflow-y-auto rounded-xl p-2 space-y-1" style={{ border: '1px solid var(--app-border)' }}>
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm px-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(s.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStudentIds((ids) => [...ids, s.id]);
                    else setSelectedStudentIds((ids) => ids.filter((id) => id !== s.id));
                  }}
                />
                {s.name} ({s.grade})
              </label>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="청구명"
              className="rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="금액"
              className="rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
            <input
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              placeholder="청구 월"
              className="rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || selectedStudentIds.length === 0 || !title || !amount || !dueDate}
              onClick={() =>
                void run(() =>
                  onBulkSelected(
                    selectedStudentIds,
                    title,
                    parseInt(amount, 10),
                    dueDate,
                    billingMonth
                  )
                )
              }
              className="app-btn app-btn-primary disabled:opacity-50"
            >
              {selectedStudentIds.length}명 청구
            </button>
            <button type="button" onClick={reset} className="app-btn app-btn-ghost">
              취소
            </button>
          </div>
        </div>
      )}

      {mode === 'copy' && selectedPaymentId && (
        <div className="mt-4 pt-4 flex flex-wrap items-end gap-3" style={{ borderTop: '1px solid var(--app-border)' }}>
          <label className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
            새 납부기한
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            disabled={busy || !dueDate}
            onClick={() => void run(() => onCopy(selectedPaymentId, dueDate))}
            className="app-btn app-btn-primary disabled:opacity-50"
          >
            청구 복사
          </button>
          <button type="button" onClick={reset} className="app-btn app-btn-ghost">
            취소
          </button>
        </div>
      )}

      {mode === 'due' && selectedCount > 0 && (
        <div className="mt-4 pt-4 flex flex-wrap items-end gap-3" style={{ borderTop: '1px solid var(--app-border)' }}>
          <label className="text-sm" style={{ color: 'var(--app-ink-2)' }}>
            변경할 납부기한 ({selectedCount}건)
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block rounded-xl px-3 py-2 text-sm"
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            disabled={busy || !dueDate}
            onClick={() => void run(() => onChangeDueDate(dueDate))}
            className="app-btn app-btn-primary disabled:opacity-50"
          >
            기한 변경
          </button>
          <button type="button" onClick={reset} className="app-btn app-btn-ghost">
            취소
          </button>
        </div>
      )}
    </section>
  );
}
