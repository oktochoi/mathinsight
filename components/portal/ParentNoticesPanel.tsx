'use client';

import type { Announcement } from '@/types/database';

export function ParentNoticesPanel({ items }: { items: Announcement[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-500 parent-card-soft py-6 text-center">새 공지가 없습니다.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="parent-card-soft p-4 border-l-4 border-indigo-400">
          <p className="font-semibold text-stone-900 text-sm">{a.title}</p>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap">{a.body}</p>
          <p className="text-[10px] text-stone-400 mt-2">
            {a.published_at?.slice(0, 10) ?? a.created_at.slice(0, 10)}
          </p>
        </li>
      ))}
    </ul>
  );
}
