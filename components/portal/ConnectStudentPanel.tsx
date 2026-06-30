'use client';

import { PhonePortalConnect } from '@/components/portal/PhonePortalConnect';

type Props = {
  mode: 'parent' | 'student';
  initialAcademyCode?: string;
  onSubmitted?: () => void;
};

/** 휴대폰 + 학원 코드 기반 포털 연결 */
export function ConnectStudentPanel({ mode, initialAcademyCode, onSubmitted }: Props) {
  return (
    <PhonePortalConnect
      mode={mode}
      initialAcademyCode={initialAcademyCode}
      onLinked={onSubmitted}
    />
  );
}
