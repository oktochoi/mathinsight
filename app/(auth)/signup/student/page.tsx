'use client';

import { PhoneSignupWizard } from '@/components/auth/PhoneSignupWizard';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';

export default function StudentSignupPage() {
  return (
    <>
      <AuthMobileLogo />
      <PhoneSignupWizard mode="student" />
    </>
  );
}
