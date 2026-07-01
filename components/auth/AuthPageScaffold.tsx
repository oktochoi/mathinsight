'use client';

import type { ReactNode } from 'react';
import { AuthMobileLogo } from '@/components/auth/AuthBrandPanel';

export function AuthPageScaffold({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthMobileLogo />
      {children}
    </>
  );
}
