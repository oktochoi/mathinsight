import Link from 'next/link';
import { ConsultationStatusBadge } from '@/components/consultation/ConsultationStatusBadge';
import type { ConsultationStatus } from '@/types/database';

export function SavedDocumentList({
  title,
  loading,
  emptyMessage,
  items,
}: {
  title: string;
  loading?: boolean;
  emptyMessage?: string;
  items: {
    id: string;
    href: string;
    primary: string;
    secondary: string;
    consultationStatus?: ConsultationStatus;
  }[];
}) {
  if (loading) {
    return <p className="text-xs text-slate-400 py-2">불러오는 중…</p>;
  }
  if (items.length === 0) {
    return emptyMessage ? (
      <p className="text-xs text-slate-400 py-2">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      <p className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-100">
        {title} ({items.length}건)
      </p>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-700">
                  {item.primary}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.secondary}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.consultationStatus && (
                  <ConsultationStatusBadge status={item.consultationStatus} />
                )}
                <i className="ri-arrow-right-s-line text-slate-300 group-hover:text-indigo-500" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
