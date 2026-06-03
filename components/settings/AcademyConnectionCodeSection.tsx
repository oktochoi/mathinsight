'use client';

import { useState } from 'react';
import { useAcademyConnectionCode } from '@/hooks/useAcademyConnectionCode';

export function AcademyConnectionCodeSection() {
  const { code, academyName, regenerate } = useAcademyConnectionCode();
  const [copyMsg, setCopyMsg] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyMsg('복사됨');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('복사 실패');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('학원 코드를 재발급하면 이전 코드는 사용할 수 없습니다. 계속할까요?')) return;
    setRegenerating(true);
    const { error } = await regenerate();
    setRegenerating(false);
    if (error) alert(error);
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-indigo-100 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">학원 연결 코드</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          학부모·학생에게 <strong>학원 코드 1개</strong>만 안내하세요. 포털에서 코드와 학생 이름을 입력하면
          아래 「연결 요청」에 표시되며, 승인 시 연결됩니다.
        </p>
      </div>

      {code ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-xl font-bold text-indigo-900 tracking-wider font-mono">{code}</code>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer hover:bg-indigo-100"
          >
            {copyMsg || '복사'}
          </button>
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            disabled={regenerating}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            {regenerating ? '재발급 중...' : '코드 재발급'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-400">코드를 불러오는 중이거나 마이그레이션 012 적용이 필요합니다.</p>
      )}

      {academyName && (
        <p className="text-xs text-slate-500">
          학원: <span className="font-medium text-slate-700">{academyName}</span>
        </p>
      )}
    </div>
  );
}
