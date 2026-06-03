'use client';

import { cn } from '@/lib/cn';

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
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-500">
        최근 내역 불러오는 중…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">최근 자동 처리 내역</h3>
        <p className="text-xs text-slate-500 mt-0.5">언제 무엇이 만들어졌는지 시간순</p>
      </div>
      {feed.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          아직 자동 처리 기록이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {feed.slice(0, 12).map((item) => (
            <li
              key={item.id}
              className="flex gap-3 text-sm rounded-lg bg-slate-50 px-3 py-2.5 border border-slate-100"
            >
              <span className="text-xs text-slate-500 tabular-nums shrink-0 w-11 pt-0.5">
                {item.time}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 text-xs">{item.agentLabel}</p>
                <p className="text-sm text-slate-700 mt-0.5">{item.message}</p>
                <span className="text-[10px] text-slate-500 mt-1 inline-block">
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
