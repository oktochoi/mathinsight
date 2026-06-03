'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

export type AgentJobRow = {
  id: string;
  student_id: string;
  current_step: string;
  status: string;
  workflow_type: string;
  updated_at: string;
  students?: { id: string; name: string; grade: string } | { id: string; name: string; grade: string }[] | null;
};

const STEPS = [
  { key: 'risk_detection', label: '① 위험 신호 점검' },
  { key: 'counseling', label: '② 상담 카드 준비' },
  { key: 'parent_communication', label: '③ 학부모 리포트 초안' },
] as const;

function studentName(job: AgentJobRow): string {
  const s = job.students;
  if (!s) return '학생';
  const row = Array.isArray(s) ? s[0] : s;
  return row?.name ?? '학생';
}

function stepState(
  stepKey: string,
  currentStep: string,
  status: string
): 'done' | 'active' | 'pending' | 'failed' {
  const order = STEPS.map((s) => s.key);
  const cur = order.indexOf(currentStep as (typeof STEPS)[number]['key']);
  const idx = order.indexOf(stepKey as (typeof STEPS)[number]['key']);
  if (status === 'completed') return 'done';
  if (status === 'failed' && idx === cur) return 'failed';
  if (idx < cur) return 'done';
  if (idx === cur && status === 'running') return 'active';
  if (idx === cur && status === 'pending') return 'pending';
  return 'pending';
}

const STATE_LABEL = {
  done: '완료',
  active: '진행 중',
  pending: '대기',
  failed: '오류',
} as const;

export function AgentWorkflowPanel({
  jobs,
  loading,
}: {
  jobs: AgentJobRow[];
  loading?: boolean;
}) {
  if (loading && jobs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-500">
        진행 상황 불러오는 중…
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <p className="text-sm font-medium text-slate-700">자동 처리 대기 중인 학생 없음</p>
        <p className="text-xs text-slate-500 mt-1">
          상담·보강이 필요한 학생이 생기면 여기에 단계별 진행이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">학생별 자동 처리 단계</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          점검 → 상담 카드 → 학부모 리포트 순으로 진행됩니다
        </p>
      </div>
      <ul className="space-y-3">
        {jobs.slice(0, 5).map((job) => (
          <li
            key={job.id}
            className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
          >
            <Link
              href={`/students/${job.student_id}`}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
            >
              {studentName(job)}
            </Link>
            <ul className="mt-2 space-y-1">
              {STEPS.map((step) => {
                const state = stepState(step.key, job.current_step, job.status);
                return (
                  <li
                    key={step.key}
                    className={cn(
                      'text-xs flex items-center gap-2',
                      state === 'active' && 'text-indigo-700 font-medium',
                      state === 'done' && 'text-emerald-700',
                      state === 'failed' && 'text-rose-700',
                      state === 'pending' && 'text-slate-400'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        state === 'active' && 'bg-indigo-500 animate-pulse',
                        state === 'done' && 'bg-emerald-500',
                        state === 'failed' && 'bg-rose-500',
                        state === 'pending' && 'bg-slate-300'
                      )}
                    />
                    {step.label} · {STATE_LABEL[state]}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
