'use client';

import { useState } from 'react';
import { ConnectAcademyPanel } from '@/components/portal/ConnectAcademyPanel';

type Props = { onNext: () => void };

export default function StepTeacherJoin({ onNext }: Props) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">학원 참여</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          원장에게 받은 <strong>학원 참여 코드</strong>(EDU-XXXX-XX)를 입력하세요.
        </p>
      </div>

      <ConnectAcademyPanel onJoined={() => setJoined(true)} />

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
