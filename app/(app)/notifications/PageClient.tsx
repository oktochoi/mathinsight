'use client';

import { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useNotifications } from '@/hooks/useNotifications';
import { useIntegrations } from '@/hooks/useIntegrations';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner, EmptyState } from '@/components/ui/DataStates';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';
import type { CSSProperties } from 'react';
import type { NotificationChannel, NotificationStatus } from '@/types/database';

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  sms: '문자(SMS)',
  kakao: '카카오 알림톡',
  in_app: '앱 내 알림',
};

const STATUS_LABELS: Record<NotificationStatus, string> = {
  queued: '대기',
  sent: '발송',
  failed: '실패',
  demo: '데모',
};

const STATUS_STYLES: Record<NotificationStatus, CSSProperties> = {
  queued: { background: 'var(--app-surface-2)', color: 'var(--app-ink-2)', border: '1px solid var(--app-border)' },
  sent: { background: '#f0fdf4', color: '#065f46', border: '1px solid #a7f3d0' },
  failed: { background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' },
  demo: { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' },
};

const TEMPLATES = [
  { key: 'payment_reminder', label: '수강료 안내', body: '[학원명] {학생} 학부모님, {월} 수강료 납부 기한을 안내드립니다.' },
  { key: 'absent', label: '결석 안내', body: '[학원명] 오늘 {학생} 학생이 결석하였습니다. 확인 부탁드립니다.' },
  { key: 'counseling', label: '상담 예약', body: '[학원명] {학생} 상담이 예약되었습니다. 일정을 확인해 주세요.' },
];

export default function NotificationsPage() {
  const { students } = useStudents();
  const { logs, loading, error, sendDemo } = useNotifications();
  const { integrations } = useIntegrations();
  const [channel, setChannel] = useState<NotificationChannel>('sms');
  const [recipient, setRecipient] = useState('');
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const applyTemplate = (key: string) => {
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    const st = students.find((s) => s.id === studentId);
    setMessage(
      t.body.replace('{학생}', st?.name ?? '학생').replace('{월}', new Date().toLocaleDateString('ko-KR', { month: 'long' }))
    );
  };

  const handleSend = async () => {
    if (!recipient.trim() || !message.trim()) return;
    setSending(true);
    const result = await sendDemo({
      channel,
      recipient_label: recipient.trim(),
      message: message.trim(),
      student_id: studentId || undefined,
    });
    setSending(false);
    if (result.error) {
      setToast(result.error);
      return;
    }
    setToast('발송 기록이 저장되었습니다. (데모 모드일 수 있음)');
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <PageLoader />;

  const smsOn = integrations?.sms_enabled;
  const kakaoOn = integrations?.kakao_enabled;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title={STAFF_PAGES.notifications.title} />
      {error && <ErrorBanner message={error} />}
      {toast && (
        <p className="text-sm rounded-xl px-3 py-2" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#065f46' }}>
          {toast}
        </p>
      )}

      <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
        SMS {smsOn ? '활성' : '비활성'} · 카카오 {kakaoOn ? '활성' : '비활성'} ·{' '}
        <a href="/settings?tab=integrations" className="hover:underline" style={{ color: 'var(--app-accent)' }}>
          연동 설정
        </a>
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="app-card p-5 space-y-3">
          <h2 className="font-bold" style={{ color: 'var(--app-ink)' }}>메시지 발송</h2>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as NotificationChannel)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            <option value="sms">문자 (SMS)</option>
            <option value="kakao">카카오 알림톡</option>
            <option value="in_app">앱 내 알림</option>
          </select>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            <option value="">학생 (선택)</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="수신자 (예: 김민준 학부모 010-****)"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => applyTemplate(t.key)}
                className="text-xs px-2.5 py-1 rounded-full cursor-pointer transition-colors hover:bg-[var(--app-surface-2)]"
                style={{ border: '1px solid var(--app-border)', color: 'var(--app-ink-2)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="메시지 내용"
            className="w-full rounded-xl px-3 py-2 text-sm resize-y"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <button
            type="button"
            disabled={sending || !recipient || !message}
            onClick={() => void handleSend()}
            className="w-full app-btn app-btn-primary disabled:opacity-50"
          >
            발송 (또는 데모 기록)
          </button>
        </div>

        <div className="app-card overflow-hidden">
          <div className="p-4" style={{ borderBottom: '1px solid var(--app-border)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--app-ink)' }}>발송 기록</h2>
          </div>
          {logs.length === 0 ? (
            <EmptyState title="발송 기록 없음" description="메시지를 내면 여기에 표시됩니다." />
          ) : (
            <ul className="divide-y divide-[var(--app-border)] max-h-[420px] overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: 'var(--app-ink-2)' }}>
                      {CHANNEL_LABELS[log.channel]}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={STATUS_STYLES[log.status]}
                    >
                      {STATUS_LABELS[log.status]}
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--app-ink-4)' }}>
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>{log.recipient_label}</p>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--app-ink-2)' }}>{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
