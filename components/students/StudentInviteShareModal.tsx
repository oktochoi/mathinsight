'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  studentName: string;
  loginCode: string;
  initialPin: string;
  inviteUrl: string;
  parentInviteUrls?: { label: string; url: string }[];
  onClose: () => void;
};

export function StudentInviteShareModal({
  studentName,
  loginCode,
  initialPin,
  inviteUrl,
  parentInviteUrls = [],
  onClose,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('복사되었습니다.');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--app-ink)' }}>
            {studentName} 학생 초대 정보
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
            학생에게 QR·링크·초기 PIN을 전달하세요. 첫 로그인 후 6자리 개인 PIN을 설정합니다.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <Row label="로그인 코드" value={loginCode} onCopy={() => copy('code', loginCode)} copied={copied === 'code'} />
          <Row label="초기 PIN" value={initialPin} onCopy={() => copy('pin', initialPin)} copied={copied === 'pin'} />
          <Row label="초대 링크" value={inviteUrl} onCopy={() => copy('url', inviteUrl)} copied={copied === 'url'} truncate />
        </div>

        {parentInviteUrls.length > 0 && (
          <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--app-border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--app-ink-2)' }}>
              학부모 초대 링크
            </p>
            {parentInviteUrls.map((p, i) => (
              <Row
                key={i}
                label={p.label}
                value={p.url}
                onCopy={() => copy(`parent-${i}`, p.url)}
                copied={copied === `parent-${i}`}
                truncate
              />
            ))}
            <p className="text-[11px]" style={{ color: 'var(--app-ink-4)' }}>
              이메일 자동 발송은 추후 연동됩니다. 링크를 직접 전달해 주세요.
            </p>
          </div>
        )}

        <button type="button" onClick={onClose} className="app-btn app-btn-primary w-full">
          확인
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  copied,
  truncate,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--app-surface-2)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
          {label}
        </p>
        <p className={`font-mono text-xs mt-0.5 ${truncate ? 'truncate' : ''}`} style={{ color: 'var(--app-ink)' }}>
          {value}
        </p>
      </div>
      <button type="button" onClick={onCopy} className="text-xs font-medium shrink-0" style={{ color: 'var(--app-accent)' }}>
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  );
}
