'use client';

import { StaffChatInbox } from '@/components/chat/StaffChatInbox';

export function StaffChatSection({ initialChannelId }: { initialChannelId?: string | null }) {
  return <StaffChatInbox initialChannelId={initialChannelId} />;
}
