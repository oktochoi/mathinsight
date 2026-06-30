'use client';

import { useMemo, useState } from 'react';
import {
  aggregateGrowthPipelineMetrics,
  acquisitionSourceLabel,
  INTAKE_STATUS_LABELS,
  INTAKE_STATUS_STYLES,
} from '@/lib/growthPipeline';
import { IntakeConsultationForm } from '@/components/counseling/IntakeConsultationForm';
import { IntakeConsultationRecord } from '@/components/counseling/IntakeConsultationRecord';
import { useIntakeConsultations } from '@/hooks/useIntakeConsultations';
import { EmptyState } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

function formatScheduled(iso: string | null | undefined) {
  if (!iso) return '일정 미정';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IntakeConsultationPanel() {
  const { intakes, loading, createIntake, updateIntakeRecord } = useIntakeConsultations();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const metrics = useMemo(() => aggregateGrowthPipelineMetrics(intakes), [intakes]);
  const selected = intakes.find((i) => i.id === selectedId) ?? null;

  const upcoming = intakes.filter((i) =>
    ['scheduled', 'completed', 'on_hold'].includes(i.intake_status)
  );

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl px-6 py-6 app-panel-accent"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
              Growth Pipeline
            </p>
            <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--app-ink)' }}>
              신입 원생 상담
            </h2>
            <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--app-ink-3)' }}>
              문의부터 상담·등록까지의 흐름을 기록합니다. 유입 경로와 전환 데이터는 이후 리포트 분석의 기반이 됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="app-btn app-btn-primary text-sm shrink-0"
          >
            <i className="ri-user-add-line" />
            신입 상담 등록
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[
            { label: '신규 문의', value: metrics.inquiries },
            { label: '상담 예약', value: metrics.scheduled },
            { label: '상담 완료', value: metrics.completed },
            { label: '등록 완료', value: metrics.registered },
            { label: '전환율', value: `${metrics.conversionRate}%` },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                {kpi.label}
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: 'var(--app-ink)' }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <p className="text-sm rounded-xl px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
          {toast}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--app-border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
              신입 상담 목록
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
              {loading ? '불러오는 중…' : `총 ${intakes.length}건 · 진행 중 ${upcoming.length}건`}
            </p>
          </div>

          {intakes.length === 0 ? (
            <EmptyState
              title="등록된 신입 상담이 없습니다"
              description="신입 상담 등록으로 문의 학생과 유입 경로를 기록하세요."
            />
          ) : (
            <ul className="divide-y max-h-[520px] overflow-y-auto" style={{ borderColor: 'var(--app-border)' }}>
              {intakes.map((intake) => (
                <li key={intake.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(intake.id)}
                    className={cn(
                      'w-full text-left px-5 py-4 hover:bg-[var(--app-surface-2)] transition-colors',
                      selectedId === intake.id && 'bg-sky-50/60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--app-ink)' }}>
                          {intake.prospect_name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                          {intake.grade} · {formatScheduled(intake.counseling_sessions?.scheduled_at)}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--app-ink-4)' }}>
                          {acquisitionSourceLabel(intake.acquisition_source)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border',
                          INTAKE_STATUS_STYLES[intake.intake_status]
                        )}
                      >
                        {INTAKE_STATUS_LABELS[intake.intake_status]}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {selected ? (
            <IntakeConsultationRecord
              intake={selected}
              onClose={() => setSelectedId(null)}
              onSave={(patch) => updateIntakeRecord(selected.id, patch)}
              onConvertToStudent={() => {
                setToast(`${selected.prospect_name} 학생이 재원 상태로 전환되었습니다.`);
                setTimeout(() => setToast(''), 3500);
              }}
            />
          ) : (
            <div
              className="rounded-2xl px-6 py-16 text-center"
              style={{
                background: 'var(--app-surface-2)',
                border: '1px dashed var(--app-border)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--app-ink-3)' }}>
                상담을 선택하면 기록을 작성할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <IntakeConsultationForm
          onClose={() => setFormOpen(false)}
          onSubmit={async (input) => {
            const result = await createIntake(input);
            if (!result.error && result.id) {
              setSelectedId(result.id);
              setToast('신입 상담이 등록되었습니다. 시간표에서 예약을 확인하세요.');
              setTimeout(() => setToast(''), 3500);
            }
            return { error: result.error };
          }}
        />
      )}
    </div>
  );
}
