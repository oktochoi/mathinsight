'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Step2Profile({ onNext }: { onNext: () => void }) {
  const { profile, refresh } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhone((profile as unknown as { phone?: string }).phone ?? '');
    }
  }, [profile]);

  const handleNext = async () => {
    if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
    if (!phone.trim()) { setError('휴대전화를 입력해 주세요.'); return; }
    if (!profile?.id) return;

    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('users')
      .update({ name: name.trim(), phone: phone.trim() })
      .eq('id', profile.id);

    if (err) { setError(err.message); setSaving(false); return; }

    await refresh();
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">원장 프로필</h2>
        <p className="text-sm text-slate-500 mt-1">학원 운영자 정보를 입력해 주세요.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            휴대전화 <span className="text-red-500">*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="예: 010-1234-5678"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleNext()}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer mt-2"
      >
        {saving ? '저장 중…' : '다음 →'}
      </button>
    </div>
  );
}
