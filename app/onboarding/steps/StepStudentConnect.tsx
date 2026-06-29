'use client';

import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';

type Props = { onNext: () => void };

export default function StepStudentConnect({ onNext }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">학원 연결</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          학원에서 받은 학원 코드와 내 이름(학원 등록명)을 입력하세요. 나중에 연결할 수도 있습니다.
        </p>
      </div>

      <ConnectStudentPanel mode="student" onSubmitted={onNext} />

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
        나중에 연결하기
      </button>
    </div>
  );
}
