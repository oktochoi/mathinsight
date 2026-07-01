'use client';

import { Toaster } from 'sonner';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <Toaster position="top-center" richColors closeButton />
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthBrandPanel className="hidden lg:flex" />
        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          {children}
        </div>
      </div>
    </div>
  );
}
