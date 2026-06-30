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
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdAcademyName, setCreatedAcademyName] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyMsg('복사됨');
      setTimeout(() => setCopyMsg(''), 2000);
    } catch {
      setCopyMsg('복사 실패');
    }
  };

  const handleCreate = async () => {
    if (!academyName.trim()) {
      setError('학원 이름을 입력해 주세요.');
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    setError('');

    const { data: existing } = await supabase
      .from('academies')
      .select('id, connection_code, name')
      .eq('owner_id', profile.id)
      .maybeSingle();

    let academyId: string;
    let connectionCode: string;

    if (existing?.id) {
      const { data: updated, error: updateErr } = await supabase
        .from('academies')
        .update({ name: academyName.trim() })
        .eq('id', existing.id)
        .select('id, connection_code, name')
        .single();
      if (updateErr || !updated) {
        setError(updateErr?.message ?? '학원 저장에 실패했습니다.');
        setSaving(false);
        return;
      }
      academyId = updated.id;
      connectionCode = updated.connection_code;
      setCreatedAcademyName(updated.name);
    } else {
      const { data: created, error: createErr } = await supabase
        .from('academies')
        .insert({ name: academyName.trim(), owner_id: profile.id })
        .select('id, connection_code, name')
        .single();
      if (createErr || !created) {
        setError(createErr?.message ?? '학원 생성에 실패했습니다.');
        setSaving(false);
        return;
      }
      academyId = created.id;
      connectionCode = created.connection_code;
      setCreatedAcademyName(created.name);

      await fetch('/api/subscription/trial', { method: 'POST' });
    }

    if (!connectionCode) {
      const { data: regen } = await supabase.rpc('regenerate_academy_connection_code', {
        p_academy_id: academyId,
      });
      const result = regen as { ok?: boolean; connection_code?: string } | null;
      connectionCode = result?.connection_code ?? '';
    }

    const { error: userErr } = await supabase
      .from('users')
      .update({ academy_id: academyId })
      .eq('id', profile.id);

    if (userErr) {
      setError(userErr.message);
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    setCreatedCode(connectionCode);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('참여 코드를 입력해 주세요.');
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    setError('');

    const { data, error: rpcErr } = await supabase.rpc('join_academy_by_code', {
      p_code: inviteCode.trim().toUpperCase(),
    });
    const result = data as { ok?: boolean; error?: string } | null;

    if (rpcErr || !result?.ok) {
      setError(result?.error === 'invalid_code' ? '유효하지 않은 참여 코드입니다.' : rpcErr?.message ?? '참여에 실패했습니다.');
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    onNext();
  };

  if (createdCode) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            {createdAcademyName || academyName} 학원이 준비되었습니다
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            아래 참여 코드를 강사·학부모·학생에게 공유하세요.
          </p>
        </div>

        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-5 text-center space-y-3">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">학원 참여 코드</p>
          <code className="text-2xl font-bold text-indigo-900 tracking-wider font-mono block">
            {createdCode}
          </code>
          <button
            type="button"
            onClick={() => void copyCode(createdCode)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700"
          >
            {copyMsg || '코드 복사'}
          </button>
          <p className="text-[11px] text-slate-500">
            설정 → 기본 탭에서도 확인할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
        >
          시작하기 →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">학원 설정</h2>
        <p className="text-xs text-slate-500 mt-0.5">새 학원을 만들거나 기존 학원에 참여하세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['create', '새 학원 만들기', 'ri-add-circle-line', '학원을 새로 개설합니다'],
            ['join', '기존 학원 참여', 'ri-door-open-line', '참여 코드로 합류합니다'],
          ] as const
        ).map(([m, label, icon, desc]) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError('');
            }}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
              mode === m
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-200'
            }`}
          >
            <i className={`${icon} text-xl ${mode === m ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <p className={`text-sm font-semibold ${mode === m ? 'text-blue-700' : 'text-slate-700'}`}>
                {label}
              </p>
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
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">참여 코드 *</label>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="EDU-XXXX-XX"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
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
