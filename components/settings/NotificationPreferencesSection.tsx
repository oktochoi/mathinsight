'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  PUSH_PREF_CATEGORIES,
  fetchNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
  type PushPrefCategory,
} from '@/lib/notificationPreferences';

export function NotificationPreferencesSection({ title = '알림 설정' }: { title?: string }) {
  const { profile } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    void fetchNotificationPrefs(supabase, profile.id).then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, [profile?.id]);

  const toggle = async (id: PushPrefCategory) => {
    if (!profile?.id) return;
    const next = { ...prefs, [id]: !(prefs[id] !== false) };
    setPrefs(next);
    setSaving(true);
    const { error } = await saveNotificationPrefs(supabase, profile.id, next);
    setSaving(false);
    if (error) setToast(error);
    else setToast('저장되었습니다.');
    setTimeout(() => setToast(''), 2000);
  };

  if (loading) {
    return (
      <div className="app-card p-6">
        <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
          불러오는 중…
        </p>
      </div>
    );
  }

  return (
    <div className="app-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          {title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
          앱 푸시 알림을 카테고리별로 켜거나 끌 수 있습니다. (기본: 모두 켜짐)
        </p>
      </div>
      {toast && (
        <p className="text-xs rounded-lg px-3 py-2 app-inline-success">{toast}</p>
      )}
      <ul className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
        {PUSH_PREF_CATEGORIES.map((cat) => {
          const on = prefs[cat.id] !== false;
          return (
            <li key={cat.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {cat.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
                  {cat.desc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={saving}
                onClick={() => void toggle(cat.id)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50"
                style={{ background: on ? 'var(--app-accent)' : 'var(--app-border-md)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
