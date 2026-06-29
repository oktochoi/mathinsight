'use client';

import type { AgentLog, AgentLogStatus, DashboardAgentInsight } from '@/types/database';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<AgentLogStatus, string> = {
  running: 'bg-sky-50 text-sky-800 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
};

const STATUS_LABEL: Record<AgentLogStatus, string> = {
  running: '동작 중',
  completed: '정상',
  failed: '확인 필요',
  pending: '대기',
};

const AGENT_NAME_KO: Record<string, string> = {
  risk_detection: '학습 신호 점검',
  counseling: '상담 카드 준비',
  parent_communication: '학부모 리포트',
  dashboard: '대시보드 정리',
  parent_rag: '학부모 AI 상담',
};

function formatTime(iso: string | null) {
  if (!iso) return '기록 없음';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 접기 가능 — 원장에게 필수는 아님 */
export function AgentArchitecturePanel({
  insight,
  logs,
  loading,
}: {
  insight: DashboardAgentInsight | null;
  logs: AgentLog[];
  loading?: boolean;
}) {
  if (loading && !insight) return null;
  if (!insight) return null;

  return (
    <details className="rounded-2xl group" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}>
      <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--app-ink-2)' }}>
        <span>시스템 동작 상태 (선택 · 기술 정보)</span>
        <i className="ri-arrow-down-s-line text-lg group-open:rotate-180 transition-transform" aria-hidden />
      </summary>
      <div className="px-5 pb-5 space-y-4 pt-4" style={{ borderTop: '1px solid var(--app-border)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
          발표·개발 확인용입니다. 평소에는 위 「조치할 학생」 목록만 보셔도 됩니다.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {insight.agentStatuses.map((a) => (
            <div
              key={a.agentType}
              className="rounded-xl px-3 py-3"
              style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--app-ink)' }}>
                {AGENT_NAME_KO[a.agentType] ?? a.label}
              </p>
              <span
                className={cn(
                  'inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                  STATUS_STYLES[a.status]
                )}
              >
                {STATUS_LABEL[a.status]}
              </span>
              <p className="text-[10px] mt-2" style={{ color: 'var(--app-ink-4)' }}>마지막: {formatTime(a.lastRunAt)}</p>
            </div>
          ))}
        </div>
        {logs.length > 0 && (
          <ul className="max-h-32 overflow-y-auto space-y-1 text-xs" style={{ color: 'var(--app-ink-2)' }}>
            {logs.slice(0, 6).map((log) => (
              <li key={log.id} className="py-1 truncate" style={{ borderBottom: '1px solid var(--app-border)' }}>
                {AGENT_NAME_KO[log.agent_type] ?? log.agent_type} · {log.action}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
