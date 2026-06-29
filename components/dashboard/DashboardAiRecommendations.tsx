'use client';

import Link from 'next/link';
import type { AttentionStudent } from '@/types/database';
import { RISK_KIND_STYLES } from '@/lib/studentRisk';

export function DashboardAiRecommendations({
  students,
  loading,
}: {
  students: AttentionStudent[];
  loading?: boolean;
}) {
  const top = students[0];

  return (
    <section className="rounded-2xl border border-violet-200/90 overflow-hidden" style={{ background: 'var(--app-surface)' }}>
      <div className="px-5 py-4 border-b border-violet-100/80 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
          <i className="ri-sparkling-2-line text-white text-lg" />
        </div>
        <div>
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">AI 추천</p>
          <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>지금 확인하면 좋은 학생</h2>
        </div>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--app-ink-3)' }}>분석 중…</p>
      ) : !top ? (
        <p className="px-5 py-6 text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
          오늘은 AI가 추가로 권장할 학생이 없습니다. 출결·숙제 기록을 유지해 주세요.
        </p>
      ) : (
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--app-ink-2)' }}>
              <strong style={{ color: 'var(--app-ink)' }}>{top.name}</strong> 학생 상담을 권장합니다.
              {top.reason ? ` ${top.reason}` : ''}
            </p>
            <span
              className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                RISK_KIND_STYLES[top.riskKind ?? 'consultation']
              }`}
            >
              {top.riskKindLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/students/${top.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
            >
              <i className="ri-chat-smile-3-line" />
              상담 시작
            </Link>
            <Link
              href={`/counseling?step=prep&student=${top.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 text-violet-800 text-sm font-medium hover:bg-violet-50"
            >
              AI 상담 준비
            </Link>
          </div>
        </div>
      )}

      {students.length > 1 && (
        <ul className="border-t border-violet-100 divide-y divide-violet-50">
          {students.slice(1, 4).map((s) => (
            <li key={s.id}>
              <Link
                href={`/students/${s.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50/50 text-sm"
              >
                <span className="font-medium" style={{ color: 'var(--app-ink)' }}>{s.name}</span>
                <span className="truncate flex-1" style={{ color: 'var(--app-ink-3)' }}>{s.reason}</span>
                <i className="ri-arrow-right-s-line shrink-0" style={{ color: 'var(--app-ink-4)' }} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
