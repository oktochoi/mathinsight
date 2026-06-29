'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const SUBJECTS = ['수학', '영어', '국어', '과학', '사회', '물리', '화학', '생물', '코딩', '기타'];
const GRADES = [
  '초1', '초2', '초3', '초4', '초5', '초6',
  '중1', '중2', '중3',
  '고1', '고2', '고3',
];

export default function Step4Class({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { profile, academy } = useAuth();
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('수학');
  const [grade, setGrade] = useState('중1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!className.trim()) { setError('반 이름을 입력해 주세요.'); return; }
    if (!academy?.id || !profile?.id) return;

    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('classes')
      .insert({
        name: className.trim(),
        grade,
        academy_id: academy.id,
        teacher_id: profile.id,
      });

    if (err) { setError(err.message); setSaving(false); return; }

    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">첫 반 만들기</h2>
        <p className="text-sm text-slate-500 mt-1">첫 번째 수업 반을 만들어 보세요. 나중에 더 추가할 수 있습니다.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            반 이름 <span className="text-red-500">*</span>
          </label>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="예: 중등 수학 A반"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">과목</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">학년</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          나중에
        </button>
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={saving}
          className="flex-2 flex-grow py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {saving ? '저장 중…' : '완료 →'}
        </button>
      </div>
    </div>
  );
}
