'use client';

type Props = {
  source: 'gemini' | 'rules' | null;
  fallbackReason: string | null;
};

export function AiRulesFallbackBanner({ source, fallbackReason }: Props) {
  if (source !== 'rules' && !fallbackReason) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: 'var(--app-warning-bg)',
        border: '1px solid var(--app-warning-border)',
        color: 'var(--app-warning-text)',
      }}
      role="status"
    >
      <p className="font-semibold">AI가 아닌 기본 양식으로 생성되었습니다</p>
      {fallbackReason && (
        <p className="text-xs mt-1 opacity-90">{fallbackReason}</p>
      )}
    </div>
  );
}
