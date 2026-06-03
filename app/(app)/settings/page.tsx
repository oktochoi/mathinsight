'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ErrorBanner } from '@/components/ui/DataStates';
import { ClassesSection } from '@/components/settings/ClassesSection';
import { ClassSchedulesSection } from '@/components/schedules/ClassSchedulesSection';
import { PortalInviteSection } from '@/components/settings/PortalInviteSection';
import { PageHeader } from '@/components/ui/PageHeader';
import { StaffPageIntro } from '@/components/ui/StaffPageIntro';
import { STAFF_PAGES } from '@/lib/staffPages';
import { AcademyConnectionCodeSection } from '@/components/settings/AcademyConnectionCodeSection';
import { ConnectionRequestsSection } from '@/components/settings/ConnectionRequestsSection';

export default function SettingsPage() {
  const { profile, academy, refresh } = useAuth();
  const [academyName, setAcademyName] = useState('');
  const [userName, setUserName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAcademyName(academy?.name ?? '');
    setUserName(profile?.name ?? '');
  }, [academy, profile]);

  const saveAcademy = async () => {
    if (!academy?.id) return;
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('academies')
      .update({ name: academyName })
      .eq('id', academy.id);
    if (err) setError(err.message);
    else {
      setToast('저장되었습니다.');
      await refresh();
    }
    setSaving(false);
    setTimeout(() => setToast(''), 2000);
  };

  const saveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error: err } = await supabase.from('users').update({ name: userName }).eq('id', profile.id);
    if (err) setError(err.message);
    else {
      setToast('계정 정보가 저장되었습니다.');
      await refresh();
    }
    setSaving(false);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl w-full min-w-0">
      {toast && <div className="rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">{toast}</div>}
      {error && <ErrorBanner message={error} />}

      <PageHeader title={STAFF_PAGES.settings.title} description={STAFF_PAGES.settings.description} />
      <StaffPageIntro pageKey="settings" />

      <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold">학원 정보</h3>
        <input
          value={academyName}
          onChange={(e) => setAcademyName(e.target.value)}
          className="w-full px-3 py-2 border rounded-xl text-sm"
          placeholder="학원 이름"
        />
        <button
          type="button"
          onClick={saveAcademy}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50 cursor-pointer"
        >
          학원명 저장
        </button>
      </div>

      <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold">계정</h3>
        <p className="text-xs text-slate-500">{profile?.email}</p>
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full px-3 py-2 border rounded-xl text-sm"
          placeholder="이름"
        />
        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm disabled:opacity-50 cursor-pointer"
        >
          이름 저장
        </button>
      </div>

      <ClassesSection />
      <ClassSchedulesSection />
      <AcademyConnectionCodeSection />
      <ConnectionRequestsSection />
      <PortalInviteSection />

      <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <p>알림·데이터보내기 등은 추후 버전에서 제공 예정입니다.</p>
        <p className="mt-2">
          DB: <code className="bg-white px-1 rounded">001</code>, <code className="bg-white px-1 rounded">002</code>,{' '}
          <code className="bg-white px-1 rounded">003_classes_portal_link.sql</code>
        </p>
      </div>
    </div>
  );
}
