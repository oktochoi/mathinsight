'use client';

import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';

type Props = { onNext: () => void };

export default function StepParentConnect({ onNext }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">자녀 연결</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          학원에서 받은 <strong>학원 코드</strong>를 입력하면 등록된 자녀가 표시됩니다.
        </p>
      </div>

      <ConnectStudentPanel mode="parent" onSubmitted={onNext} />

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
        나중에 연결하고 시작하기
      </button>
    </div>
  );
}
