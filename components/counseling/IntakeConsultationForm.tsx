'use client';

import { useState } from 'react';
import {
  ACQUISITION_SOURCE_OPTIONS,
  INTAKE_STATUS_LABELS,
} from '@/lib/growthPipeline';
import { useAcademyStaff, type CreateIntakeInput } from '@/hooks/useIntakeConsultations';
import type { AcquisitionSource } from '@/types/database';

const GRADE_OPTIONS = [
  '초1', '초2', '초3', '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
  '기타',
];

type Props = {
  onSubmit: (input: CreateIntakeInput) => Promise<{ error: string | null }>;
  onClose: () => void;
};

export function IntakeConsultationForm({ onSubmit, onClose }: Props) {
  const staff = useAcademyStaff();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    prospect_name: '',
    grade: '중1',
    school: '',
    parent_name: '',
    parent_phone: '',
    interested_subjects: '',
    preferred_class: '',
    scheduled_at: '',
    counselor_id: '',
    acquisition_source: 'parent_referral' as AcquisitionSource,
    acquisition_source_other: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prospect_name.trim()) {
      setError('학생 이름을 입력해 주세요.');
      return;
    }
    if (!form.scheduled_at) {
      setError('상담 희망일을 선택해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await onSubmit({
      prospect_name: form.prospect_name,
      grade: form.grade,
      school: form.school,
      parent_name: form.parent_name,
      parent_phone: form.parent_phone,
      interested_subjects: form.interested_subjects,
      preferred_class: form.preferred_class,
      scheduled_at: form.scheduled_at,
      counselor_id: form.counselor_id || undefined,
      acquisition_source: form.acquisition_source,
      acquisition_source_other:
        form.acquisition_source === 'other' ? form.acquisition_source_other : undefined,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  const fieldClass =
    'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20';
  const labelClass = 'text-xs font-semibold mb-1 block';
  const labelStyle = { color: 'var(--app-ink-3)' };

  return (
    <>
      <button type="button" className="app-overlay" onClick={onClose} aria-label="닫기" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="app-modal-panel pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-labelledby="intake-form-title"
        >
          <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--app-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
              Growth Pipeline
            </p>
            <h2 id="intake-form-title" className="text-lg font-bold mt-1" style={{ color: 'var(--app-ink)' }}>
              신입 원생 상담 등록
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
              문의 학생 정보와 유입 경로를 기록합니다. 예약은 시간표에 함께 표시됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>기본 정보</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>학생 이름 *</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.prospect_name}
                    onChange={(e) => setForm((f) => ({ ...f, prospect_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>학년 *</label>
                  <select
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>학교</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.school}
                    onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>관심 과목</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.interested_subjects}
                    onChange={(e) => setForm((f) => ({ ...f, interested_subjects: e.target.value }))}
                    placeholder="예: 수학, 영어"
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>학부모 이름</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.parent_name}
                    onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>학부모 연락처</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.parent_phone}
                    onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>희망 수업</label>
                  <input
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.preferred_class}
                    onChange={(e) => setForm((f) => ({ ...f, preferred_class: e.target.value }))}
                    placeholder="예: 중등 수학 A"
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>상담 희망일 *</label>
                  <input
                    type="datetime-local"
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.scheduled_at}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} style={labelStyle}>상담 담당자</label>
                  <select
                    className={fieldClass}
                    style={{ borderColor: 'var(--app-border)' }}
                    value={form.counselor_id}
                    onChange={(e) => setForm((f) => ({ ...f, counselor_id: e.target.value }))}
                  >
                    <option value="">담당자 선택 (기본: 본인)</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
                우리 학원을 어떻게 알게 되셨나요?
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {ACQUISITION_SOURCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer"
                    style={{
                      borderColor:
                        form.acquisition_source === opt.value
                          ? 'var(--app-accent)'
                          : 'var(--app-border)',
                      background:
                        form.acquisition_source === opt.value
                          ? 'var(--app-accent-bg)'
                          : 'var(--app-surface)',
                    }}
                  >
                    <input
                      type="radio"
                      name="acquisition_source"
                      value={opt.value}
                      checked={form.acquisition_source === opt.value}
                      onChange={() => setForm((f) => ({ ...f, acquisition_source: opt.value }))}
                      className="shrink-0"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.acquisition_source === 'other' && (
                <input
                  className={fieldClass}
                  style={{ borderColor: 'var(--app-border)' }}
                  placeholder="기타 유입 경로 입력"
                  value={form.acquisition_source_other}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, acquisition_source_other: e.target.value }))
                  }
                />
              )}
            </section>

            {error && (
              <p className="text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="app-btn app-btn-ghost text-sm">
                취소
              </button>
              <button type="submit" disabled={busy} className="app-btn app-btn-primary text-sm">
                {busy ? '등록 중…' : '신입 상담 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
