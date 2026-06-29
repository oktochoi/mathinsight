'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ErrorBanner } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { IntegrationsSettingsSection } from '@/components/settings/IntegrationsSettingsSection';
import { StaffPermissionsSection } from '@/components/settings/StaffPermissionsSection';
import { ConnectAcademyPanel } from '@/components/portal/ConnectAcademyPanel';
import { cn } from '@/lib/cn';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const ALL_TABS = [
  { id: 'general', label: '기본', ownerOnly: false },
  { id: 'operations', label: '운영', ownerOnly: false },
  { id: 'notifications', label: '알림', ownerOnly: false },
  { id: 'integrations', label: '연동', ownerOnly: false },
  { id: 'permissions', label: '직원 권한', ownerOnly: true },
] as const;

type SettingsTab = (typeof ALL_TABS)[number]['id'];

function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as SettingsTab) || 'general';
  const { profile, academy, refresh } = useAuth();
  const isOwner = profile?.role === 'owner';
  const TABS = ALL_TABS.filter((t) => !t.ownerOnly || isOwner);
  const [academyName, setAcademyName] = useState('');
  const [userName, setUserName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // 운영 설정
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [openTime, setOpenTime] = useState('14:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [opLoaded, setOpLoaded] = useState(false);

  useEffect(() => {
    setAcademyName(academy?.name ?? '');
    setUserName(profile?.name ?? '');
  }, [academy, profile]);

  useEffect(() => {
    if (!academy?.id || opLoaded) return;
    void (async () => {
      const { data } = await supabase
        .from('academy_settings')
        .select('operating_hours')
        .eq('academy_id', academy.id)
        .maybeSingle();
      if (data?.operating_hours) {
        const oh = data.operating_hours as {
          active_days?: number[];
          open_time?: string;
          close_time?: string;
        };
        if (oh.active_days) setActiveDays(oh.active_days);
        if (oh.open_time) setOpenTime(oh.open_time);
        if (oh.close_time) setCloseTime(oh.close_time);
      }
      setOpLoaded(true);
    })();
  }, [academy?.id, opLoaded]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

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
      showToast('저장되었습니다.');
      await refresh();
    }
    setSaving(false);
  };

  const saveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error: err } = await supabase.from('users').update({ name: userName }).eq('id', profile.id);
    if (err) setError(err.message);
    else {
      showToast('저장되었습니다.');
      await refresh();
    }
    setSaving(false);
  };

  const saveOperations = async () => {
    if (!academy?.id) return;
    setSaving(true);
    const operating_hours = {
      active_days: activeDays,
      open_time: openTime,
      close_time: closeTime,
    };
    const { error: err } = await supabase
      .from('academy_settings')
      .upsert(
        { academy_id: academy.id, operating_hours, updated_at: new Date().toISOString() },
        { onConflict: 'academy_id' }
      );
    if (err) setError(err.message);
    else showToast('운영 설정이 저장되었습니다.');
    setSaving(false);
  };

  const toggleDay = (d: number) =>
    setActiveDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );

  return (
    <div className="space-y-6 max-w-2xl w-full min-w-0">
      {toast && <div className="rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">{toast}</div>}
      {error && <ErrorBanner message={error} />}

      <PageHeader title="설정" />

      <nav className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: 'var(--app-border)' }}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === 'general' ? '/settings' : `/settings?tab=${t.id}`}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-[var(--app-accent)]'
                : 'border-transparent hover:border-[var(--app-border-strong)]'
            )}
            style={{ color: tab === t.id ? 'var(--app-accent-text)' : 'var(--app-ink-3)' }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'integrations' && <IntegrationsSettingsSection />}

      {tab === 'permissions' && isOwner && <StaffPermissionsSection />}

      {tab === 'notifications' && (
        <div className="app-card p-6">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>알림 설정</h3>
          <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>알림 설정은 준비 중입니다.</p>
        </div>
      )}

      {tab === 'operations' && (
        <div className="space-y-5">
          <div className="app-card p-6 space-y-5">
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>운영 요일</h3>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className="w-10 h-10 rounded-full text-sm font-semibold border transition-all cursor-pointer"
                  style={
                    activeDays.includes(i)
                      ? { background: 'var(--app-accent)', color: '#fff', borderColor: 'var(--app-accent)' }
                      : { background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', borderColor: 'var(--app-border)' }
                  }
                >
                  {day}
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--app-ink)' }}>운영 시간</h3>
              <div className="flex items-center gap-3">
                <div>
                  <label className="app-label mb-1">오픈</label>
                  <select
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <span className="mt-4" style={{ color: 'var(--app-ink-4)' }}>~</span>
                <div>
                  <label className="app-label mb-1">마감</label>
                  <select
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)' }}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveOperations}
              disabled={saving}
              className="app-btn app-btn-primary disabled:opacity-50"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <>
          {/* 학원 미연결 강사/원무 — 참여 안내 */}
          {!academy && (profile?.role === 'teacher' || profile?.role === 'desk') && (
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--app-surface)', border: '1px solid #bfdbfe' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--app-accent-bg)' }}
                >
                  <i className="ri-school-line" style={{ color: 'var(--app-accent)' }} aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>학원에 참여하지 않았습니다</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                    원장에게 학원 초대 코드를 받아 입력해 주세요.
                  </p>
                </div>
              </div>
              <ConnectAcademyPanel />
            </div>
          )}

          {/* 학원 정보 수정 — 원장만 */}
          {isOwner && (
            <div className="app-card p-6 space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>학원 정보</h3>
              <div>
                <label className="app-label mb-1">학원 이름</label>
                <input
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)', outline: 'none' }}
                  placeholder="학원 이름"
                />
              </div>
              <button
                type="button"
                onClick={saveAcademy}
                disabled={saving}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                저장
              </button>
            </div>
          )}

          <div className="app-card p-6 space-y-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>계정</h3>
            <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>{profile?.email}</p>
            <div>
              <label className="app-label mb-1">이름</label>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)', color: 'var(--app-ink)', outline: 'none' }}
                placeholder="이름"
              />
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="app-btn app-btn-primary disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm" style={{ color: 'var(--app-ink-3)' }}>설정 불러오는 중…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
