'use client';

import Link from 'next/link';
import { UserProfileForm } from '@/components/profile/UserProfileForm';
import { WebPushBanner } from '@/components/portal/WebPushBanner';
import { NotificationPreferencesSection } from '@/components/settings/NotificationPreferencesSection';

export default function ParentSettingsPageClient() {
  return (
    <div className="max-w-lg mx-auto space-y-8 pb-12">
      <div>
        <Link href="/parent" className="text-xs text-stone-500 hover:text-stone-700">
          ← 학부모 포털
        </Link>
        <h1 className="text-xl font-bold text-stone-900 mt-2">설정</h1>
        <p className="text-sm text-stone-500 mt-1">알림·프로필을 관리합니다.</p>
      </div>

      <section className="parent-card p-5 sm:p-6 space-y-4">
        <WebPushBanner />
        <NotificationPreferencesSection title="알림 수신 설정" />
      </section>

      <section className="parent-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-stone-900 mb-1">내 정보</h2>
        <p className="text-xs text-stone-500 mb-4">이름·연락처를 수정할 수 있습니다.</p>
        <UserProfileForm submitLabel="저장" />
      </section>
    </div>
  );
}
