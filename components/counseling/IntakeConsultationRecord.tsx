'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  acquisitionSourceLabel,
  INTAKE_NEXT_ACTION_OPTIONS,
  INTAKE_STATUS_LABELS,
  INTAKE_STATUS_STYLES,
  NOT_REGISTERED_REASON_OPTIONS,
  REGISTRATION_LIKELIHOOD_OPTIONS,
} from '@/lib/growthPipeline';
import type { UpdateIntakeRecordInput } from '@/hooks/useIntakeConsultations';
import type { IntakeConsultation, IntakeStatus } from '@/types/database';
import { cn } from '@/lib/cn';

function formatScheduled(iso: string | null | undefined) {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  intake: IntakeConsultation;
  onSave: (patch: UpdateIntakeRecordInput) => Promise<{ error: string | null }>;
  onClose: () => void;
  onConvertToStudent?: () => void;
};

export function IntakeConsultationRecord({
  intake,
  onSave,
  onClose,
  onConvertToStudent,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    intake_status: intake.intake_status,
    consultation_content: intake.consultation_content ?? '',
    parent_needs: intake.parent_needs ?? '',
    student_level: intake.student_level ?? '',
    recommended_class: intake.recommended_class ?? '',
    recommended_subject: intake.recommended_subject ?? '',
    registration_likelihood: intake.registration_likelihood ?? '',
    next_action: intake.next_action ?? '',
    followup_date: intake.followup_date ?? '',
    not_registered_reason: intake.not_registered_reason ?? '',
    not_registered_reason_other: intake.not_registered_reason_other ?? '',
  });

  useEffect(() => {
    setForm({
      intake_status: intake.intake_status,
      consultation_content: intake.consultation_content ?? '',
      parent_needs: intake.parent_needs ?? '',
      student_level: intake.student_level ?? '',
      recommended_class: intake.recommended_class ?? '',
      recommended_subject: intake.recommended_subject ?? '',
      registration_likelihood: intake.registration_likelihood ?? '',
      next_action: intake.next_action ?? '',
      followup_date: intake.followup_date ?? '',
      not_registered_reason: intake.not_registered_reason ?? '',
      not_registered_reason_other: intake.not_registered_reason_other ?? '',
    });
  }, [intake]);

  const save = async (patch?: UpdateIntakeRecordInput) => {
    setBusy(true);
    const payload: UpdateIntakeRecordInput = patch ?? {
      intake_status: form.intake_status as IntakeStatus,
      consultation_content: form.consultation_content || null,
      parent_needs: form.parent_needs || null,
      student_level: form.student_level || null,
      recommended_class: form.recommended_class || null,
      recommended_subject: form.recommended_subject || null,
      registration_likelihood:
        (form.registration_likelihood as 'low' | 'medium' | 'high' | '') || null,
      next_action:
        (form.next_action as UpdateIntakeRecordInput['next_action']) || null,
      followup_date: form.followup_date || null,
      registered: form.intake_status === 'registered',
      not_registered_reason:
        form.intake_status === 'not_registered'
          ? form.not_registered_reason || null
          : null,
      not_registered_reason_other:
        form.not_registered_reason === 'other'
          ? form.not_registered_reason_other || null
          : null,
    };
    const result = await onSave(payload);
    setBusy(false);
    if (result.error) {
      setToast(result.error);
      return;
    }
    setToast('저장되었습니다.');
    setTimeout(() => setToast(''), 2500);
  };

  const fieldClass =
    'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20';
  const labelClass = 'text-xs font-semibold mb-1 block';
  const labelStyle = { color: 'var(--app-ink-3)' };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--s-sm)',
      }}
    >
      <div
        className="px-5 py-4 border-b flex items-start justify-between gap-3"
        style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)' }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
            신입 상담 기록
          </p>
          <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>
            {intake.prospect_name}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
            {intake.grade}
            {intake.school ? ` · ${intake.school}` : ''} ·{' '}
            {formatScheduled(intake.counseling_sessions?.scheduled_at)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-4)' }}>
            유입: {acquisitionSourceLabel(intake.acquisition_source)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xl leading-none"
          style={{ color: 'var(--app-ink-4)' }}
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full border',
              INTAKE_STATUS_STYLES[intake.intake_status]
            )}
          >
            {INTAKE_STATUS_LABELS[intake.intake_status]}
          </span>
          {intake.parent_phone && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-3)' }}>
              {intake.parent_name ? `${intake.parent_name} · ` : ''}{intake.parent_phone}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={labelStyle}>상담 상태</label>
            <select
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.intake_status}
              onChange={(e) =>
                setForm((f) => ({ ...f, intake_status: e.target.value as IntakeStatus }))
              }
            >
              {(Object.keys(INTAKE_STATUS_LABELS) as IntakeStatus[]).map((key) => (
                <option key={key} value={key}>
                  {INTAKE_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>예상 등록 가능성</label>
            <select
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.registration_likelihood}
              onChange={(e) =>
                setForm((f) => ({ ...f, registration_likelihood: e.target.value }))
              }
            >
              <option value="">선택</option>
              {REGISTRATION_LIKELIHOOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>상담 내용</label>
          <textarea
            className={cn(fieldClass, 'min-h-[88px]')}
            style={{ borderColor: 'var(--app-border)' }}
            value={form.consultation_content}
            onChange={(e) => setForm((f) => ({ ...f, consultation_content: e.target.value }))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={labelStyle}>학부모 니즈</label>
            <textarea
              className={cn(fieldClass, 'min-h-[72px]')}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.parent_needs}
              onChange={(e) => setForm((f) => ({ ...f, parent_needs: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>학생 수준</label>
            <textarea
              className={cn(fieldClass, 'min-h-[72px]')}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.student_level}
              onChange={(e) => setForm((f) => ({ ...f, student_level: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>추천 반</label>
            <input
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.recommended_class}
              onChange={(e) => setForm((f) => ({ ...f, recommended_class: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>추천 과목</label>
            <input
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.recommended_subject}
              onChange={(e) => setForm((f) => ({ ...f, recommended_subject: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={labelStyle}>다음 액션</label>
            <select
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.next_action}
              onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))}
            >
              <option value="">선택</option>
              {INTAKE_NEXT_ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>후속 연락 예정일</label>
            <input
              type="date"
              className={fieldClass}
              style={{ borderColor: 'var(--app-border)' }}
              value={form.followup_date}
              onChange={(e) => setForm((f) => ({ ...f, followup_date: e.target.value }))}
            />
          </div>
        </div>

        {form.intake_status === 'not_registered' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} style={labelStyle}>미등록 사유</label>
              <select
                className={fieldClass}
                style={{ borderColor: 'var(--app-border)' }}
                value={form.not_registered_reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, not_registered_reason: e.target.value }))
                }
              >
                <option value="">선택</option>
                {NOT_REGISTERED_REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {form.not_registered_reason === 'other' && (
              <div>
                <label className={labelClass} style={labelStyle}>기타 사유</label>
                <input
                  className={fieldClass}
                  style={{ borderColor: 'var(--app-border)' }}
                  value={form.not_registered_reason_other}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, not_registered_reason_other: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
        )}

        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
            등록 전환
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || intake.intake_status === 'registered'}
              onClick={async () => {
                setForm((f) => ({ ...f, intake_status: 'registered' }));
                await save({ intake_status: 'registered', registered: true });
                onConvertToStudent?.();
              }}
              className="app-btn app-btn-primary text-sm"
            >
              학생으로 등록
            </button>
            <Link
              href="/schedule?tab=manage"
              className="app-btn app-btn-secondary text-sm"
            >
              체험 수업 예약
            </Link>
            <Link
              href={`/counseling?step=intake&student=${intake.student_id}`}
              className="app-btn app-btn-ghost text-sm"
            >
              후속 상담 예약
            </Link>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--app-ink-4)' }}>
            등록 완료 시 예비 학생이 재원 상태로 전환되고 유입 경로가 학생 프로필에 저장됩니다.
          </p>
        </div>

        {toast && (
          <p className="text-sm rounded-xl px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
            {toast}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="app-btn app-btn-ghost text-sm">
            닫기
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save()}
            className="app-btn app-btn-primary text-sm"
          >
            {busy ? '저장 중…' : '기록 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
