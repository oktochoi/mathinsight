'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Step1Academy({ onNext }: { onNext: () => void }) {
  const { academy, refresh } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (academy) {
      setName(academy.name === '내 학원' ? '' : academy.name);
      setPhone((academy as unknown as { phone?: string }).phone ?? '');
    }
  }, [academy]);

  const handleNext = async () => {
    if (!name.trim()) { setError('학원 이름을 입력해 주세요.'); return; }
    if (!phone.trim()) { setError('학원 전화번호를 입력해 주세요.'); return; }
    if (!ownerName.trim()) { setError('대표자명을 입력해 주세요.'); return; }
    if (!academy?.id) return;

    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('academies')
      .update({ name: name.trim(), phone: phone.trim() })
      .eq('id', academy.id);

    if (err) { setError(err.message); setSaving(false); return; }

    await refresh();
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">학원 기본정보</h2>
        <p className="text-sm text-slate-500 mt-1">학원을 소개하는 기본 정보를 입력해 주세요.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            학원 이름 <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 옥토수학학원"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            대표자명 <span className="text-red-500">*</span>
          </label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="예: 홍길동"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            학원 전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="예: 02-1234-5678"
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
