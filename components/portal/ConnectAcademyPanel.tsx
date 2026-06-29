'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onJoined?: () => void;
  compact?: boolean;
};

export function ConnectAcademyPanel({ onJoined, compact }: Props) {
  const { profile, refresh } = useAuth();
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim()) { setError('초대 코드를 입력해 주세요.'); return; }
    if (!profile?.id) return;
    setSaving(true);
    setError('');

    const { data, error: rpcErr } = await supabase.rpc('join_academy_by_code', {
      p_code: code.trim().toUpperCase(),
    });

    if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }

    const result = data as { ok: boolean; error?: string; academy_name?: string };
    if (!result.ok) {
      const MSG: Record<string, string> = {
        invalid_code: '유효하지 않은 코드입니다. 원장에게 다시 확인해 주세요.',
        staff_role_required: '강사 계정으로 로그인해 주세요.',
      };
      setError(MSG[result.error ?? ''] ?? result.error ?? '참여에 실패했습니다.');
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    setJoined(result.academy_name ?? '학원');
    onJoined?.();
  };

  if (joined) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
        <i className="ri-checkbox-circle-fill text-emerald-600 text-xl mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">학원에 참여했습니다</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            <strong>{joined}</strong>에 강사로 등록되었습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-2 text-xs text-blue-700">
          <i className="ri-information-line mt-0.5 shrink-0" />
          <p>원장에게 학원 초대 코드를 받아 입력하면 학원에 강사로 참여할 수 있습니다.</p>
        </div>
      )}
      <div>
        {!compact && (
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">학원 초대 코드</label>
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="EDU-XXXX-XX"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleJoin}
        disabled={saving || !code.trim()}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors"
      >
        {saving ? '확인 중…' : '학원 참여하기'}
      </button>
    </div>
  );
}
