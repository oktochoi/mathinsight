'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { PARENT_MORE_NAV } from '@/lib/parentPortalNav';
import { ParentPortalGate } from '@/components/portal/ParentPortalGate';

function Content() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-stone-900 px-1">더보기</h1>
      <div className="parent-card divide-y divide-stone-100 overflow-hidden">
        {PARENT_MORE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-5 py-4 hover:bg-stone-50 transition-colors"
          >
            <i className={cn(item.icon, 'text-lg text-indigo-600')} aria-hidden />
            <span className="text-sm font-semibold text-stone-800">{item.label}</span>
            <i className="ri-arrow-right-s-line text-stone-400 ml-auto" aria-hidden />
          </Link>
        ))}
      </div>
      <p className="text-xs text-stone-500 text-center px-2">
        선생님과 대화는 화면 우하단 채팅 아이콘을 이용하세요.
      </p>
    </div>
  );
}

export default function PageClient() {
  return <ParentPortalGate>{() => <Content />}</ParentPortalGate>;
}
