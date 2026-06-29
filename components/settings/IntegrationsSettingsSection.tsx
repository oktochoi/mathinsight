'use client';

import { useState } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

/** 설정 > 연동 탭 — 기존 /integrations 화면 본문 */
export function IntegrationsSettingsSection() {
  const { integrations, loading, error, icsFeedUrl, saveIntegrations, regenerateIcsToken } =
    useIntegrations();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  if (loading) return <PageLoader />;
  if (!integrations) return <ErrorBanner message="연동 설정을 불러올 수 없습니다." />;

  const patch = async (changes: Parameters<typeof saveIntegrations>[0]) => {
    setSaving(true);
    const result = await saveIntegrations(changes);
    setSaving(false);
    if (result.error) setToast(result.error);
    else {
      setToast('저장되었습니다.');
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleCopyIcs = async () => {
    if (!icsFeedUrl) return;
    await navigator.clipboard.writeText(icsFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    const result = await regenerateIcsToken();
    if (result.error) setToast(result.error);
    else {
      setToast('ICS 토큰이 재발급되었습니다.');
      setTimeout(() => setToast(''), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {toast && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {toast}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <i className="ri-calendar-line text-indigo-600" />
          Google Calendar (ICS)
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={integrations.google_calendar_enabled}
            disabled={saving}
            onChange={(e) => void patch({ google_calendar_enabled: e.target.checked })}
          />
          <span className="text-sm font-medium text-slate-800">캘린더 연동 활성화</span>
        </label>
        {icsFeedUrl && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500">ICS 구독 URL</p>
            <p className="text-xs text-slate-700 break-all font-mono">{icsFeedUrl}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCopyIcs()}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
              >
                {copied ? '복사됨' : 'URL 복사'}
              </button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-medium"
              >
                토큰 재발급
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <i className="ri-message-2-line text-sky-600" />
          문자 · 카카오
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={cn('rounded-xl border p-4', integrations.sms_enabled ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200')}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={integrations.sms_enabled}
                disabled={saving}
                onChange={(e) => void patch({ sms_enabled: e.target.checked })}
              />
              <span className="text-sm font-semibold">SMS</span>
            </label>
            <input
              key={integrations.sms_sender_name ?? 'sms'}
              defaultValue={integrations.sms_sender_name ?? ''}
              onBlur={(e) => void patch({ sms_sender_name: e.target.value || null })}
              placeholder="발신자명"
              className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className={cn('rounded-xl border p-4', integrations.kakao_enabled ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200')}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={integrations.kakao_enabled}
                disabled={saving}
                onChange={(e) => void patch({ kakao_enabled: e.target.checked })}
              />
              <span className="text-sm font-semibold">카카오 알림톡</span>
            </label>
            <input
              key={integrations.kakao_channel_name ?? 'kakao'}
              defaultValue={integrations.kakao_channel_name ?? ''}
              onBlur={(e) => void patch({ kakao_channel_name: e.target.value || null })}
              placeholder="채널명"
              className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
