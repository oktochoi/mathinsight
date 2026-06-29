'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type Props = { onNext: () => void };
type Mode = 'create' | 'join';

export default function StepOwnerAcademy({ onNext }: Props) {
  const { profile, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>('create');
  const [academyName, setAcademyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!academyName.trim()) { setError('학원 이름을 입력해 주세요.'); return; }
    if (!profile?.id) return;
    setSaving(true);
    setError('');

    // 이미 학원이 있는지 확인
    const { data: existing } = await supabase
      .from('academies')
      .select('id')
      .eq('owner_id', profile.id)
      .maybeSingle();

    let academyId: string;

    if (existing?.id) {
      // 이미 학원이 있으면 이름만 업데이트
      await supabase.from('academies').update({ name: academyName.trim() }).eq('id', existing.id);
      academyId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('academies')
        .insert({ name: academyName.trim(), owner_id: profile.id })
        .select('id')
        .single();
      if (createErr || !created) {
        setError(createErr?.message ?? '학원 생성에 실패했습니다.');
        setSaving(false);
        return;
      }
      academyId = created.id;
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({ academy_id: academyId })
      .eq('id', profile.id);

    if (userErr) { setError(userErr.message); setSaving(false); return; }

    await refresh();
    setSaving(false);
    onNext();
  };

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
      setError('유효하지 않은 초대 코드입니다.');
      setSaving(false);
      return;
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({ academy_id: academy.id })
      .eq('id', profile.id);

    if (userErr) { setError(userErr.message); setSaving(false); return; }

    await refresh();
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">학원 설정</h2>
        <p className="text-xs text-slate-500 mt-0.5">새 학원을 만들거나 기존 학원에 참여하세요.</p>
      </div>

      {/* 모드 선택 */}
      <div className="grid grid-cols-2 gap-3">
        {([['create', '새 학원 만들기', 'ri-add-circle-line', '학원을 새로 개설합니다'],
           ['join', '기존 학원 참여', 'ri-door-open-line', '초대 코드로 참여합니다']] as const).map(([m, label, icon, desc]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); }}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
              mode === m
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-200'
            }`}
          >
            <i className={`${icon} text-xl ${mode === m ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <p className={`text-sm font-semibold ${mode === m ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
              <p className="text-[11px] text-slate-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {mode === 'create' && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">학원 이름 *</label>
          <input
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            placeholder="OO수학학원"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      )}

      {mode === 'join' && (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">초대 코드 *</label>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          <p className="text-[11px] text-slate-400 mt-1">학원 설정 페이지에서 코드를 확인하세요.</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={mode === 'create' ? handleCreate : handleJoin}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors"
      >
        {saving ? '처리 중…' : mode === 'create' ? '학원 만들기' : '참여하기'}
      </button>
    </div>
  );
}
