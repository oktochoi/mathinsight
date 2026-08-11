'use client';

import Link from 'next/link';

/** 초대 우선 온보딩 — 연결 스텝 대신 안내 후 홈으로 */
export default function StepInviteComplete({
  roleLabel,
  onNext,
}: {
  roleLabel: string;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-900">
          {roleLabel} 계정은 학원 초대로 연결됩니다
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          이메일·QR 초대를 수락하면 학원과 역할이 자동으로 연결됩니다. 초대 없이 온보딩만으로는
          학원에 참여할 수 없습니다.
        </p>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
      >
        확인했어요
      </button>
      <p className="text-center text-xs text-slate-400">
        초대를 받으셨다면{' '}
        <Link href="/login" className="font-medium text-sky-600 hover:underline">
          로그인
        </Link>
        후 초대 링크를 다시 열어 주세요.
      </p>
    </div>
  );
}
