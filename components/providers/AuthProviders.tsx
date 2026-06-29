'use client';

import { AuthProvider } from '@/context/AuthContext';
import type { UserProfile } from '@/types/database';

export default function AuthProviders({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
}) {
  return <AuthProvider initialProfile={initialProfile}>{children}</AuthProvider>;
}
