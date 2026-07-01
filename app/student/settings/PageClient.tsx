'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserProfileForm } from '@/components/profile/UserProfileForm';
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { WebPushBanner } from '@/components/portal/WebPushBanner';
import { NotificationPreferencesSection } from '@/components/settings/NotificationPreferencesSection';

export default function StudentSettingsPageClient() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-12">
      <div>
        <Link href="/student" className="text-xs text-slate-500 hover:text-slate-700">
          ← 학생 포털
        </Link>
        <h1 className="text-xl font-bold text-slate-900 mt-2">설정</h1>
        <p className="text-sm text-slate-500 mt-1">알림·프로필·학원 연결을 관리합니다.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <WebPushBanner />
        <NotificationPreferencesSection title="알림 수신 설정" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <UserProfileForm submitLabel="저장" showStudentFields />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">학원 연결</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            학원 코드와 등록 이름으로 연결을 요청합니다.
          </p>
        </div>
        <ConnectStudentPanel
          mode="student"
          onSubmitted={() => {
            router.replace('/student');
            router.refresh();
          }}
        />
      </section>
    </div>
  );
}
