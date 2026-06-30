'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ChatUnreadProvider } from '@/context/ChatUnreadContext';
import type { UserProfile } from '@/types/database';

export default function AuthProviders({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
}) {
  return (
    <AuthProvider initialProfile={initialProfile}>
      <ChatUnreadProvider>{children}</ChatUnreadProvider>
    </AuthProvider>
  );
}
