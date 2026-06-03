'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithRole,
  signUpWithEmail,
  fetchUserProfile,
  resolvePostLoginPath,
  oauthLoginErrorMessage,
} from '@/lib/auth';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

type AuthMode = 'login' | 'signup';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-indigo-100/80 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-shadow';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const oauthErr = oauthLoginErrorMessage(searchParams.get('error'));
    if (oauthErr) setError(oauthErr);
    if (searchParams.get('registered') === '1') {
      setMode('login');
      const mail = searchParams.get('email');
      if (mail) setEmail(mail);
      setInfo(
        searchParams.get('confirm') === '1'
          ? '가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.'
          : '가입이 완료되었습니다. 로그인해 주세요.'
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo(null);

    if (mode === 'signup') {
      if (!name.trim() || !email.trim()) {
        setError('이름과 이메일을 입력해 주세요.');
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
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err, hasSession, needsEmailConfirmation } = await signUpWithEmail({
          email,
          password,
          name: name.trim(),
        });
        if (err) {
          setError(err);
          return;
        }
        if (needsEmailConfirmation && !hasSession) {
          setMode('login');
          setInfo('인증 메일을 확인한 뒤 로그인해 주세요. 이어서 역할을 선택합니다.');
          return;
        }
        if (hasSession) {
          router.replace('/auth/choose-role');
          return;
        }
      } else {
        const { error: err, profile, user, needsChooseRole, rawDbRole } = await signInWithRole(
          email,
          password
        );
        if (err) {
          setError(err);
          return;
        }
        if (!user) {
          setError('로그인에 실패했습니다.');
          return;
        }
        if (needsChooseRole) {
          router.replace('/auth/choose-role');
          return;
        }
        const fresh = (await fetchUserProfile(user.id)) ?? profile;
        const dest = resolvePostLoginPath(user, fresh, searchParams.get('next'), rawDbRole);
        router.replace(dest);
      }
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? '로그인' : '회원가입';
  const subtitle =
    mode === 'login'
      ? 'EduFlow에 다시 오신 것을 환영해요'
      : '가입 후 역할(원장·학부모·학생)을 선택합니다';

  return (
    <AuthPageShell title={title} subtitle={subtitle}>
      <div className="flex rounded-xl bg-slate-100/80 p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-indigo-600'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError('');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-indigo-600'
          }`}
        >
          회원가입
        </button>
      </div>

      {info && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 text-sm text-emerald-800">
          {info}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <GoogleSignInButton disabled={loading} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="이름"
              required
            />
          </div>
        )}
        <div>
          <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={mode === 'signup' ? '8자 이상' : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 cursor-pointer"
            >
              <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
            </button>
          </div>
        </div>
        {mode === 'signup' && (
          <div>
            <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">
              비밀번호 확인
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="soft-btn-primary w-full disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading
            ? mode === 'login'
              ? '로그인 중...'
              : '가입 처리 중...'
            : mode === 'login'
              ? '로그인'
              : '회원가입'}
        </button>
      </form>

      {mode === 'signup' && (
        <p className="text-xs text-slate-500/90 mt-4 text-center leading-relaxed">
          Google·이메일 가입 모두 완료 후 <strong className="text-indigo-600">역할 선택</strong> 화면으로
          이동합니다.
        </p>
      )}
    </AuthPageShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell title="로그인" subtitle="불러오는 중...">
          <p className="text-center text-sm text-slate-500 py-8">잠시만 기다려 주세요</p>
        </AuthPageShell>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
