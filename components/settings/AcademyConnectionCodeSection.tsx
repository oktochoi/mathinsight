'use client';

import { useMemo, useState } from 'react';
import { useAcademyConnectionCode } from '@/hooks/useAcademyConnectionCode';
import { getJoinInviteUrl } from '@/lib/inviteLink';

export function AcademyConnectionCodeSection({ compact = false }: { compact?: boolean }) {
  const { publicCode, legacyCode, academyName, codeIssuedAt, regeneratePublicCode } =
    useAcademyConnectionCode();
  const [copyMsg, setCopyMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const issuedLabel = useMemo(() => {
    if (!codeIssuedAt) return null;
    const d = new Date(codeIssuedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [codeIssuedAt]);

  const inviteUrl = useMemo(
    () => (publicCode ? getJoinInviteUrl(publicCode) : ''),
    [publicCode]
  );

  const copyText = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} 복사됨`);
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('복사 실패');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('학원 코드를 재발급하면 이전 코드는 사용할 수 없습니다. 계속할까요?')) return;
    setRegenerating(true);
    const { error } = await regeneratePublicCode();
    setRegenerating(false);
    if (error) alert(error);
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-indigo-100 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">학원 코드</h3>
        <p className="text-xs text-slate-500 mt-1">
          학생·학부모에게 코드를 알려 주세요. 가입 후 포털에서 한 번만 입력하면 연결됩니다.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          코드는 만료되지 않습니다. 재발급하면 이전 코드는 즉시 사용할 수 없습니다.
        </p>
        {issuedLabel && (
          <p className="text-[11px] text-slate-500 mt-1">
            발급일: <span className="font-medium text-slate-600">{issuedLabel}</span>
            <span className="text-slate-400"> · 유효 기간 무기한</span>
          </p>
        )}
      </div>

      {publicCode ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-2xl font-bold text-indigo-900 tracking-wider font-mono">
              {publicCode}
            </code>
            <button
              type="button"
              onClick={() => void copyText(publicCode, '코드')}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer hover:bg-indigo-100"
            >
              {copyMsg || '코드 복사'}
            </button>
            {!compact && (
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {regenerating ? '재발급 중...' : '코드 재발급'}
              </button>
            )}
          </div>

          {inviteUrl && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700">가입 링크</p>
              <p className="text-xs text-slate-500 break-all font-mono">{inviteUrl}</p>
              <button
                type="button"
                onClick={() => void copyText(inviteUrl, '링크')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                링크 복사
              </button>
            </div>
          )}

          {legacyCode && legacyCode !== publicCode && (
            <p className="text-[11px] text-slate-400">
              이전 형식 코드(호환): <span className="font-mono">{legacyCode}</span>
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400">
          코드를 불러오는 중이거나 마이그레이션 044 적용이 필요합니다.
        </p>
      )}

      {academyName && (
        <p className="text-xs text-slate-500">
          학원: <span className="font-medium text-slate-700">{academyName}</span>
        </p>
      )}
    </div>
  );
}
