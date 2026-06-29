'use client';

export type AgentFeedItem = {
  id: string;
  time: string;
  agentLabel: string;
  agentType: string;
  status: string;
  message: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  completed: '완료',
  running: '처리 중',
  failed: '실패',
  pending: '대기',
};

export function AgentActionFeed({
  feed,
  loading,
}: {
  feed: AgentFeedItem[];
  loading?: boolean;
}) {
  if (loading && feed.length === 0) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)', color: 'var(--app-ink-3)' }}>
        최근 내역 불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>최근 자동 처리 내역</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>언제 무엇이 만들어졌는지 시간순</p>
      </div>
      {feed.length === 0 ? (
        <p className="text-sm py-4 text-center rounded-xl border-dashed" style={{ color: 'var(--app-ink-3)', background: 'var(--app-surface-2)', border: '1px dashed var(--app-border)' }}>
          아직 자동 처리 기록이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {feed.slice(0, 12).map((item) => (
            <li
              key={item.id}
              className="flex gap-3 text-sm rounded-lg px-3 py-2.5"
              style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
            >
              <span className="text-xs tabular-nums shrink-0 w-11 pt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                {item.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs" style={{ color: 'var(--app-ink)' }}>{item.agentLabel}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-2)' }}>{item.message}</p>
                <span className="text-[10px] mt-1 inline-block" style={{ color: 'var(--app-ink-4)' }}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
