'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { RolePicker } from '@/components/auth/RolePicker';
import { savePendingAcademyCode } from '@/lib/academyCodeStorage';
import type { SignupRole } from '@/lib/roles';

type JoinRole = Extract<SignupRole, 'student' | 'parent' | 'teacher'>;

const JOIN_ROLES: JoinRole[] = ['student', 'parent', 'teacher'];

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
          <RolePicker
            allowedRoles={JOIN_ROLES}
            onChange={(next) => {
              if (JOIN_ROLES.includes(next as JoinRole)) setRole(next as JoinRole);
            }}
          />
        </AuthFormCard>
      </>
    );
  }

  if (role === 'teacher') {
    return (
      <>
        <AuthMobileLogo />
        <PhoneSignupWizard mode="teacher" />
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
