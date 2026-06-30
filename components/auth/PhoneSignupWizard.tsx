'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signUpWithEmail } from '@/lib/auth';
import { formatPhoneDisplay, isValidPhoneKr, normalizePhoneKr, phoneToAuthEmail } from '@/lib/phone';
import { MOCK_SMS_CODE, readVerifiedPhone, type PhoneVerificationState } from '@/lib/phoneAuth';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField, AuthInput, AuthPasswordInput, AuthSubmitButton } from '@/components/auth/AuthField';
import { AUTH_ROUTES } from '@/lib/authRoutes';

type Mode = 'student' | 'parent';

type Props = {
  mode: Mode;
};

type Step = 'phone' | 'verify' | 'account';

const MODE_LABEL = { student: '학생', parent: '학부모' } as const;

export function PhoneSignupWizard({ mode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(readVerifiedPhone() ?? '');
  const [smsCode, setSmsCode] = useState('');
  const [smsHint, setSmsHint] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifiedPhone = normalizePhoneKr(phone);

  const handleSendSms = async () => {
    setError('');
    if (!isValidPhoneKr(normalizePhoneKr(phone))) {
      setError('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
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

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: smsCode }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? '인증 실패');
        return;
      }
      const normalized = normalizePhoneKr(phone);
      const state: PhoneVerificationState = {
        phone: normalized,
        verified: true,
        verifiedAt: Date.now(),
      };
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('eduflow_phone_verified', JSON.stringify(state));
      }
      setPhone(normalized);
      setStep('account');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError('');
    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreed) {
      setError('약관에 동의해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const email = phoneToAuthEmail(verifiedPhone);
      const { error: err, hasSession } = await signUpWithEmail({
        email,
        password,
        name: name.trim(),
        role: mode,
        phone: verifiedPhone,
      });
      if (err) {
        setError(err);
        return;
      }
      if (!hasSession) {
        setError('가입 후 로그인이 필요합니다.');
        return;
      }
      toast.success('가입이 완료되었습니다. 학원 연결을 진행해 주세요.');
      router.replace(mode === 'student' ? '/student' : '/parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormCard
      title={`${MODE_LABEL[mode]} 가입`}
      subtitle="휴대폰 인증 후 로그인에 사용할 비밀번호를 설정합니다"
    >
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <AuthField label="휴대폰 번호">
            <AuthInput
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AuthField>
          <p className="text-[11px] text-slate-500">가입 후 이 번호가 로그인 아이디로 사용됩니다.</p>
          <AuthSubmitButton type="button" onClick={() => void handleSendSms()} disabled={!isValidPhoneKr(phone) || loading}>
            인증번호 받기
          </AuthSubmitButton>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {formatPhoneDisplay(verifiedPhone)} 로 인증번호를 보냈습니다.
          </p>
          {smsHint && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{smsHint}</p>}
          <AuthField label="인증번호">
            <AuthInput
              inputMode="numeric"
              placeholder={MOCK_SMS_CODE}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
            />
          </AuthField>
          <AuthSubmitButton type="button" onClick={() => void handleVerify()} loading={loading}>
            인증 확인
          </AuthSubmitButton>
        </div>
      )}

      {step === 'account' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
            <span className="text-slate-400">로그인 아이디</span>
            <p className="font-semibold text-slate-900 mt-0.5">{formatPhoneDisplay(verifiedPhone)}</p>
          </div>
          <AuthField label="이름">
            <AuthInput value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </AuthField>
          <AuthField label="비밀번호">
            <AuthPasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상"
              show={false}
              onToggle={() => {}}
            />
          </AuthField>
          <AuthField label="비밀번호 확인">
            <AuthInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
            />
          </AuthField>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              <Link href="/terms" className="text-sky-600 hover:underline">
                이용약관
              </Link>
              과{' '}
              <Link href="/privacy" className="text-sky-600 hover:underline">
                개인정보처리방침
              </Link>
              에 동의합니다.
            </span>
          </label>
          <AuthSubmitButton loading={loading} type="button" onClick={() => void handleCreateAccount()}>
            가입 완료
          </AuthSubmitButton>
          <p className="text-[11px] text-slate-500 text-center">
            가입 후 학원 연결은 포털 화면에서 한 번만 진행합니다.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        이미 계정이 있으신가요? <Link href={AUTH_ROUTES.login} className="text-sky-600 hover:underline">로그인</Link>
      </p>
    </AuthFormCard>
  );
}
