'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useChatUnread } from '@/context/ChatUnreadContext';
import { cn } from '@/lib/cn';

type Tab = 'direct' | 'class';

export function StudentChatInbox({
  studentId,
  classId,
  studentName,
  compact,
}: {
  studentId: string;
  classId?: string | null;
  studentName: string;
  compact?: boolean;
}) {
  const { markChannelRead } = useChatUnread();
  const [tab, setTab] = useState<Tab>('class');
  const [directChannelId, setDirectChannelId] = useState<string | null>(null);
  const [classChannelId, setClassChannelId] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'class', label: '반 톡방', show: !!classId },
    { id: 'direct', label: '담당 선생님', show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const activeTab = visibleTabs.some((t) => t.id === tab) ? tab : (visibleTabs[0]?.id ?? 'direct');

  return (
    <div className="flex flex-col h-full min-h-0">
      {visibleTabs.length > 1 && (
        <div className="flex gap-1.5 shrink-0 mb-2">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors',
                activeTab === t.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {activeTab === 'direct' ? (
          <ChatPanel
            channelId={directChannelId}
            studentId={studentId}
            directAudience="student"
            title={compact ? undefined : `${studentName} · 담당 선생님`}
            compact={compact}
            onChannelReady={setDirectChannelId}
            onMarkRead={markChannelRead}
          />
        ) : classId ? (
          <ChatPanel
            channelId={classChannelId}
            classId={classId}
            title={compact ? undefined : '반 톡방'}
            compact={compact}
            onChannelReady={setClassChannelId}
            onMarkRead={markChannelRead}
          />
        ) : (
          <ChatPanel
            channelId={directChannelId}
            studentId={studentId}
            directAudience="student"
            title={compact ? undefined : '담당 선생님'}
            compact={compact}
            onChannelReady={setDirectChannelId}
            onMarkRead={markChannelRead}
          />
        )}
      </div>
    </div>
  );
}
