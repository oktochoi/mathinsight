'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatPhoneDisplay, isValidPhoneKr, normalizePhoneKr } from '@/lib/phone';
import { MOCK_SMS_CODE } from '@/lib/phoneAuth';
import { postAuthPath } from '@/lib/auth';
import { fetchUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { toDbRole } from '@/lib/roles';
import { AuthField, AuthInput, AuthSubmitButton } from '@/components/auth/AuthField';

type Step = 'phone' | 'verify' | 'done';

export function PhoneLinkWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsHint, setSmsHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifiedPhone = normalizePhoneKr(phone);

  const handleSendSms = async () => {
    setError('');
    if (!isValidPhoneKr(verifiedPhone)) {
      setError('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: verifiedPhone }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? '인증 요청 실패');
        return;
      }
      setSmsHint(
        process.env.NODE_ENV === 'production'
          ? '인증번호를 입력해 주세요.'
          : `개발 모드: 인증번호 ${MOCK_SMS_CODE} 를 입력하세요.`
      );
      setStep('verify');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPhone = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: verifiedPhone, code: smsCode }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? '휴대폰 등록 실패');
        return;
      }
      setStep('done');
      toast.success('휴대폰 인증이 완료되었습니다.');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const profile = await fetchUserProfile(user.id);
      const rawDbRole = profile ? toDbRole(profile.role) : null;
      router.replace(postAuthPath(user, profile, rawDbRole));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="auth-error-banner">{error}</div>}

      {step === 'phone' && (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--auth-muted)' }}>
            Google 등으로 로그인하셨더라도, 서비스 이용을 위해 휴대폰 인증이 필요합니다. 인증한 번호는
            계정 확인·알림에 사용됩니다.
          </p>
          <AuthField label="휴대폰 번호">
            <AuthInput
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AuthField>
          <AuthSubmitButton type="button" onClick={() => void handleSendSms()} disabled={!isValidPhoneKr(phone) || loading}>
            인증번호 받기
          </AuthSubmitButton>
        </>
      )}

      {step === 'verify' && (
        <>
          <p className="text-xs" style={{ color: 'var(--auth-muted)' }}>
            {formatPhoneDisplay(verifiedPhone)} 로 인증번호를 보냈습니다.
          </p>
          {smsHint && (
            <p
              className="text-xs rounded-lg px-3 py-2"
              style={{
                color: 'var(--app-warning-text)',
                background: 'var(--app-warning-bg)',
              }}
            >
              {smsHint}
            </p>
          )}
          <AuthField label="인증번호">
            <AuthInput
              inputMode="numeric"
              placeholder={MOCK_SMS_CODE}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
            />
          </AuthField>
          <AuthSubmitButton type="button" onClick={() => void handleLinkPhone()} loading={loading}>
            인증 완료
          </AuthSubmitButton>
          <button
            type="button"
            className="w-full text-xs py-2"
            style={{ color: 'var(--auth-muted)' }}
            onClick={() => setStep('phone')}
          >
            번호 다시 입력
          </button>
        </>
      )}

      {step === 'done' && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--auth-muted)' }}>
          이동 중…
        </p>
      )}
    </div>
  );
}
