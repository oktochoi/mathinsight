'use client';

function OverviewCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 min-w-0"
      style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-1 truncate" style={{ color: 'var(--app-ink)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--app-ink-3)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StudentOverviewRow({
  recentAttendance,
  recentHomework,
  recentScore,
  recentCounseling,
  recentParent,
  reregLabel,
}: {
  recentAttendance: string;
  recentHomework: string;
  recentScore: string;
  recentCounseling: string;
  recentParent: string;
  reregLabel: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>
        Student Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <OverviewCard label="최근 출석" value={recentAttendance} />
        <OverviewCard label="최근 숙제" value={recentHomework} />
        <OverviewCard label="최근 성적" value={recentScore} />
        <OverviewCard label="최근 상담" value={recentCounseling} />
        <OverviewCard label="최근 부모 소통" value={recentParent} />
        <OverviewCard label="재등록" value={reregLabel} />
      </div>
    </section>
  );
}
