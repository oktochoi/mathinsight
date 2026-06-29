'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = 7 + i;
  return { value: h, label: `${h}:00` };
});

const FEATURES = [
  { key: 'counseling', label: '상담 카드', desc: '학생별 상담 기록 및 이력 관리' },
  { key: 'parent_reports', label: '학부모 보고서', desc: '수업 후 학부모에게 보고서 발송' },
  { key: 'billing', label: '수강료 관리', desc: '수납 현황 및 미납 알림' },
];

export default function Step3Settings({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { academy } = useAuth();
  const [activeDays, setActiveDays] = useState<string[]>(['월', '화', '수', '목', '금']);
  const [openTime, setOpenTime] = useState(9);
  const [closeTime, setCloseTime] = useState(21);
  const [features, setFeatures] = useState<Record<string, boolean>>({
    counseling: true,
    parent_reports: true,
    billing: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (d: string) => {
    setActiveDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleFeature = (k: string) => {
    setFeatures((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleNext = async () => {
    if (!academy?.id) return;
    if (openTime >= closeTime) { setError('마감 시간이 시작 시간보다 늦어야 합니다.'); return; }

    setSaving(true);
    setError('');

    const operating_hours = {
      active_days: activeDays,
      open_time: `${String(openTime).padStart(2, '0')}:00`,
      close_time: `${String(closeTime).padStart(2, '0')}:00`,
      features,
    };

    const { error: err } = await supabase
      .from('academy_settings')
      .upsert(
        { academy_id: academy.id, operating_hours, updated_at: new Date().toISOString() },
        { onConflict: 'academy_id' }
      );

    if (err) { setError(err.message); setSaving(false); return; }

    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">운영 설정</h2>
        <p className="text-sm text-slate-500 mt-1">학원 운영 요일, 시간, 사용할 기능을 설정하세요.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* 운영 요일 */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">운영 요일</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                activeDays.includes(d)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 운영 시간 */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">운영 시간</label>
        <div className="flex items-center gap-3">
          <select
            value={openTime}
            onChange={(e) => setOpenTime(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400">~</span>
          <select
            value={closeTime}
            onChange={(e) => setCloseTime(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 기능 선택 */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">사용할 기능</label>
        <div className="space-y-2">
          {FEATURES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFeature(f.key)}
              className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors text-left"
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  features[f.key] ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                {features[f.key] && <i className="ri-check-line text-white text-xs" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{f.label}</p>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
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
          {saving ? '저장 중…' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
