'use client';

import Link from 'next/link';
import type { DashboardAgentInsight } from '@/types/database';
import { cn } from '@/lib/cn';

function StudentList({
  title,
  hint,
  students,
  tone,
}: {
  title: string;
  hint: string;
  students: DashboardAgentInsight['consultationStudents'];
  tone: 'violet' | 'amber' | 'sky';
}) {
  const styles = {
    violet: 'border-violet-200 bg-violet-50/60',
    amber: 'border-amber-200 bg-amber-50/60',
    sky: 'border-sky-200 bg-sky-50/60',
  };

  return (
    <div className={cn('rounded-xl border p-4', styles[tone])}>
      <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>{title}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-2)' }}>{hint}</p>
      <p className="text-2xl font-bold text-indigo-700 tabular-nums mt-2">
        {students.length}
        <span className="text-sm font-medium ml-1" style={{ color: 'var(--app-ink-2)' }}>명</span>
      </p>
      {students.length === 0 ? (
        <p className="text-xs mt-3" style={{ color: 'var(--app-ink-3)' }}>해당 학생 없음</p>
      ) : (
        <ul className="mt-3 space-y-2 border-t border-white/60 pt-3">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/students/${s.id}`}
                className="block text-sm hover:text-indigo-700 transition-colors"
              >
                <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>{s.name}</span>
                <span className="ml-1 text-xs" style={{ color: 'var(--app-ink-3)' }}>{s.grade}</span>
                <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--app-ink-2)' }}>{s.reason}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardAgentCenter({ insight }: { insight: DashboardAgentInsight | null }) {
  if (!insight) return null;

  const hasAny =
    insight.consultationStudents.length > 0 ||
    insight.makeupStudents.length > 0 ||
    insight.parentContactStudents.length > 0;

  return (
    <section className="rounded-2xl border border-violet-200/80 p-5 sm:p-6 space-y-4" style={{ background: 'var(--app-surface)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-700">수업 기록 기반 자동 분류</p>
          <h2 className="text-lg font-bold mt-0.5" style={{ color: 'var(--app-ink)' }}>조치 유형별로 나눈 목록</h2>
          <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--app-ink-2)' }}>
            최근 점수·숙제·출결을 보고 「상담」「보강」「학부모 연락」이 필요한 학생만
            골라 두었습니다. 이름을 누르면 학생 상세로 이동합니다.
          </p>
          <p className="text-xs mt-2 rounded-lg px-3 py-2" style={{ color: 'var(--app-ink-3)', background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}>
            {insight.priorityExplanation}
            {insight.riskSummary.stable + insight.riskSummary.recovering > 0 ? (
              <>
                {' '}
                · 양호·회복 학생은 목록에 표시하지 않습니다 (학생 관리에서 확인)
              </>
            ) : null}
          </p>
        </div>
      </div>

      {!hasAny ? (
        <p className="text-sm py-6 text-center rounded-xl" style={{ color: 'var(--app-ink-2)', background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
          지금은 특별히 연락·상담이 필요한 학생이 없습니다. 수업 기록을 꾸준히 입력해 주세요.
        </p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <StudentList
            title="① 학부모 상담 권장"
            hint="전화·대면 상담을 먼저 잡으세요"
            students={insight.consultationStudents}
            tone="violet"
          />
          <StudentList
            title="② 보강 수업 권장"
            hint="보강 일정·반 편성을 검토하세요"
            students={insight.makeupStudents}
            tone="amber"
          />
          <StudentList
            title="③ 학부모 안내"
            hint="필요 시 학부모에게 안내"
            students={insight.parentContactStudents}
            tone="sky"
          />
        </div>
      )}
    </section>
  );
}
