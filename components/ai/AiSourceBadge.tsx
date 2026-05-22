'use client';

type Props = {
  source: 'gemini' | 'rules' | null;
  backend?: string | null;
  fallbackReason?: string | null;
  generating?: boolean;
};

export function AiSourceBadge({ source, backend, fallbackReason, generating }: Props) {
  if (generating) {
    return <span className="ml-2 text-slate-400 text-xs">생성 중…</span>;
  }

  if (!source) return null;

  if (source === 'gemini') {
    return (
      <span className="ml-2 inline-flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
          Gemini
        </span>
        {backend && (
          <span className="text-[10px] text-slate-500">{backend}</span>
        )}
      </span>
    );
  }

  return (
    <span className="ml-2 inline-flex flex-col sm:inline-flex sm:flex-row sm:items-center gap-1">
      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        규칙 생성
      </span>
      {fallbackReason && (
        <span className="text-[10px] text-amber-800/90 max-w-md leading-snug" title={fallbackReason}>
          {fallbackReason}
        </span>
      )}
    </span>
  );
}
