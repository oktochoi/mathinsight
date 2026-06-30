'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { savePendingAcademyCode } from '@/lib/academyCodeStorage';
import type { SignupRole } from '@/lib/roles';
import { cn } from '@/lib/cn';

type JoinRole = Extract<SignupRole, 'student' | 'parent' | 'teacher'>;

function JoinAcademyPageInner({ academyCode }: { academyCode: string }) {
  const [role, setRole] = useState<JoinRole | null>(null);

  useEffect(() => {
    savePendingAcademyCode(academyCode);
  }, [academyCode]);

  if (!role) {
    return (
      <>
        <AuthMobileLogo />
        <AuthFormCard title="학원 가입" subtitle={`코드 ${academyCode} — 역할을 선택해 주세요`}>
          <p className="text-xs text-slate-500 mb-4">
            가입 후 포털·온보딩에서 학원 연결을 진행합니다. 코드는 한 번만 입력하면 됩니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { value: 'student' as const, label: '학생', icon: 'ri-graduation-cap-line' },
                { value: 'parent' as const, label: '학부모', icon: 'ri-parent-line' },
                { value: 'teacher' as const, label: '강사', icon: 'ri-user-star-line' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 px-3.5 py-3.5 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-300 cursor-pointer text-left'
                )}
              >
                <i className={`${opt.icon} text-xl text-indigo-500`} />
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </AuthFormCard>
      </>
    );
  }

  if (role === 'teacher') {
    return (
      <>
        <AuthMobileLogo />
        <AuthFormCard
          title="강사 가입"
          subtitle={`학원 코드 ${academyCode} — 이메일 계정으로 가입합니다`}
        >
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            강사는 이메일·비밀번호로 가입합니다. 가입 후 온보딩 화면에서 이 학원 코드가 자동으로
            채워집니다.
          </p>
          <Link
            href="/signup?role=teacher"
            className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            강사 가입 계속하기
          </Link>
          <button
            type="button"
            onClick={() => setRole(null)}
            className="mt-3 w-full py-2.5 text-sm text-slate-500 hover:text-slate-700"
          >
            ← 역할 다시 선택
          </button>
        </AuthFormCard>
      </>
    );
  }

  return (
    <>
      <AuthMobileLogo />
      <PhoneSignupWizard mode={role} />
    </>
  );
}

export default function JoinAcademyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const academyCode = code.toUpperCase();

  return (
    <Suspense
      fallback={
        <>
          <AuthMobileLogo />
          <AuthFormCard title="학원 가입" subtitle="불러오는 중...">
            <p className="py-8 text-center text-sm text-slate-500">잠시만 기다려 주세요</p>
          </AuthFormCard>
        </>
      }
    >
      <JoinAcademyPageInner academyCode={academyCode} />
    </Suspense>
  );
}
