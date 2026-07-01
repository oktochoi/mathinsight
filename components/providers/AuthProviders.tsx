'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ChatUnreadProvider } from '@/context/ChatUnreadContext';
import { FlutterPushSync } from '@/components/providers/FlutterPushSync';
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
      <FlutterPushSync />
      <ChatUnreadProvider>{children}</ChatUnreadProvider>
    </AuthProvider>
  );
}
