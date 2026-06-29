'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

const MessagesPage = lazy(() => import('@/app/(app)/messages/PageClient'));
const NoticesPage = lazy(() => import('@/app/(app)/notices/PageClient'));

type TabKey = 'messages' | 'notices';

const TABS: { key: TabKey; label: string; icon: string; description: string }[] = [
  {
    key: 'messages',
    label: '학부모 문의',
    icon: 'ri-mail-send-line',
    description: '포털 문의 확인 · 답변',
  },
  {
    key: 'notices',
    label: '공지',
    icon: 'ri-megaphone-line',
    description: '학원 공지 작성',
  },
];

export default function ParentHubClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = rawTab === 'notices' ? 'notices' : 'messages';

  useEffect(() => {
    if (rawTab === 'reports') {
      const student = searchParams.get('student');
      router.replace(
        student ? `/consultation-cards?student=${student}` : '/consultation-cards'
      );
      return;
    }
    if (rawTab === 'notifications') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'messages');
      params.delete('filter');
      params.delete('class');
      params.delete('date');
      router.replace(`/parent-hub?${params.toString()}`);
    }
  }, [rawTab, searchParams, router]);

  const setTab = (tab: TabKey) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    router.replace(`/parent-hub?${params.toString()}`);
  };

  const activeMeta = TABS.find((t) => t.key === activeTab);

  return (
    <div className="space-y-0 w-full min-w-0 max-w-full">
      <div className="mb-5">
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--app-ink)', letterSpacing: '-0.03em' }}
        >
          학부모 소통
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--app-ink-3)' }}>
          문의 답변과 공지를 한 곳에서 처리합니다. 상담·리포트는 상담 메뉴에서 진행하세요.
        </p>
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6 lg:mb-8 pb-0 border-b"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <div className="flex gap-0 overflow-x-auto pb-px -mb-px min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer shrink-0',
                activeTab === tab.key
                  ? 'border-[var(--app-accent)]'
                  : 'border-transparent hover:border-[var(--app-border-strong)]'
              )}
              style={{ color: activeTab === tab.key ? 'var(--app-accent-text)' : 'var(--app-ink-3)' }}
            >
              <i className={cn(tab.icon, 'text-sm')} />
              {tab.label}
            </button>
          ))}
        </div>
        {activeMeta && (
          <p className="text-xs sm:ml-auto pb-2.5 shrink-0" style={{ color: 'var(--app-ink-4)' }}>
            {activeMeta.description}
          </p>
        )}
      </div>

      <div className="lg:pt-4">
        <Suspense fallback={<PageLoader />}>
          {activeTab === 'messages' && <MessagesPage />}
          {activeTab === 'notices' && <NoticesPage />}
        </Suspense>
      </div>
    </div>
  );
}
