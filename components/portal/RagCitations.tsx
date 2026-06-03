'use client';

import { mergeCitationsForDisplay } from '@/lib/rag/citationLabels';
import type { RagCitation } from '@/lib/vectorRag/types';

export function RagCitations({ citations }: { citations: RagCitation[] }) {
  const merged = mergeCitationsForDisplay(citations);
  if (!merged.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      <p className="text-[11px] font-semibold text-stone-500 mb-2">참고한 학원 기록</p>
      <div className="flex flex-wrap gap-1.5">
        {merged.map((c) => (
          <span
            key={c.label}
            className="text-[11px] px-2 py-1 rounded-md bg-stone-100 text-stone-600"
          >
            {c.label} {c.count}
          </span>
        ))}
      </div>
    </div>
  );
}
