'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { DashboardStats } from '@/types/database';
import type { RiskDisplayKind } from '@/lib/studentRisk';

const RISK_META: Record<
  RiskDisplayKind,
  { dot: string; bg: string; label: string; actionLabel: string }
> = {
  consultation: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 border-red-100',
    label: '상담 권장',
    actionLabel: '상담 준비',
  },
  makeup: {
    dot: 'bg-violet-500',
    bg: 'bg-violet-50 border-violet-100',
    label: '보강 권장',
    actionLabel: '학생 보기',
  },
  attention: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 border-amber-100',
    label: '주의',
    actionLabel: '학생 보기',
  },
  recovering: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50 border-emerald-100',
    label: '회복 중',
    actionLabel: '확인',
  },
  stable: {
    dot: 'bg-slate-300',
    bg: 'bg-slate-50 border-slate-100',
    label: '양호',
    actionLabel: '보기',
  },
};

export function DashboardAttentionStudents({ stats }: { stats: DashboardStats }) {
  const topStudents = stats.attentionStudents
    .filter((s) => s.riskKind === 'consultation' || s.riskKind === 'makeup')
    .slice(0, 3);

  const attentionIds = new Set(topStudents.map((s) => s.id));
  const retentionAlerts = stats.retentionRiskStudents
    .filter((r) => r.riskLevel === 'high' && !attentionIds.has(r.studentId))
    .slice(0, 2);

  if (topStudents.length === 0 && retentionAlerts.length === 0) return null;

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
            오늘 확인할 학생
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {topStudents.length + retentionAlerts.length}명
          </span>
        </div>
        <span
          className="text-[10px] font-medium uppercase tracking-wide"
          style={{ color: 'var(--app-ink-4)' }}
        >
          AI 분석
        </span>
      </div>

      <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
        {topStudents.map((student) => {
          const kind = student.riskKind ?? 'consultation';
          const meta = RISK_META[kind];
          return (
            <li key={student.id} className={cn('px-5 py-4 flex items-start gap-4', meta.bg)}>
              <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', meta.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
                    {student.name}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      background: 'white',
                      color: 'var(--app-ink-2)',
                      borderColor: 'var(--app-border)',
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
                  {student.reason}
                </p>
              </div>
              <Link
                href={`/students/${student.id}#consultation`}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--app-accent)' }}
              >
                {meta.actionLabel} →
              </Link>
            </li>
          );
        })}

        {retentionAlerts.map((r) => (
          <li key={r.studentId} className="px-5 py-4 flex items-start gap-4 bg-orange-50">
            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
                  {r.name}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-white text-orange-700 border-orange-200">
                  재등록 위험
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                {r.reason}
              </p>
            </div>
            <Link
              href={`/students/${r.studentId}`}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white"
            >
              학생 보기 →
            </Link>
          </li>
        ))}
      </ul>

      {stats.attentionStudents.length > 3 && (
        <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--app-border)' }}>
          <Link href="/students?filter=attention" className="text-xs font-medium" style={{ color: 'var(--app-accent)' }}>
            전체 {stats.attentionStudents.length}명 보기 →
          </Link>
        </div>
      )}
    </section>
  );
}
