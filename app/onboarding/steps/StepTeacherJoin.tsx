'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onNext: () => void };

export default function StepTeacherJoin({ onNext }: Props) {
  const { profile, refresh } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteCode.trim()) { setError('초대 코드를 입력해 주세요.'); return; }
    if (!profile?.id) return;
    setSaving(true);
    setError('');

    const { data: academy } = await supabase
      .from('academies')
      .select('id, name')
      .eq('connection_code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (!academy) {
      setError('유효하지 않은 초대 코드입니다. 원장에게 코드를 다시 확인해 주세요.');
      setSaving(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ academy_id: academy.id })
      .eq('id', profile.id);

    if (updateErr) { setError(updateErr.message); setSaving(false); return; }

    await refresh();
    setSaving(false);
    setJoined(academy.name as string);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">학원 참여</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          원장에게 받은 초대 코드를 입력해 주세요. 나중에 입력할 수도 있습니다.
        </p>
      </div>

      {joined ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-xl mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">{joined}</p>
            <p className="text-xs text-emerald-600 mt-0.5">학원에 성공적으로 참여했습니다.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">초대 코드</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={saving || !inviteCode.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors"
          >
            {saving ? '확인 중…' : '참여하기'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">또는</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
      >
        {joined ? '다음 →' : '나중에 입력하기'}
      </button>
    </div>
  );
}
