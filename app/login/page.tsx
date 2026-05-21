'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithRole, roleHomePath } from '@/lib/auth';
import type { UserRole } from '@/types/database';

const roles: { label: string; value: UserRole; icon: string }[] = [
  { label: '원장/강사', value: 'admin', icon: 'ri-user-star-line' },
  { label: '학부모', value: 'parent', icon: 'ri-parent-line' },
  { label: '학생', value: 'student', icon: 'ri-graduation-cap-line' },
];

function parseLoginQuery() {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get('registered') !== '1') return null;
  const email = q.get('email') ?? '';
  const role = (q.get('role') as UserRole) || 'admin';
  const needsConfirm = q.get('confirm') === '1';
  return { email, role, needsConfirm };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fromSignup = parseLoginQuery();
    if (!fromSignup) return;

    if (fromSignup.email) setEmail(fromSignup.email);
    if (roles.some((r) => r.value === fromSignup.role)) {
      setSelectedRole(fromSignup.role);
    }

    if (fromSignup.needsConfirm) {
      setWelcome(
        '회원가입이 완료되었습니다. 이메일 인증 링크를 확인한 뒤, 아래에서 로그인해 주세요.'
      );
    } else {
      setWelcome('회원가입이 완료되었습니다. 가입하신 계정으로 로그인해 주세요.');
    }

    // URL 정리 (새로고침 시 메시지 유지는 선택 — 깔끔하게 쿼리 제거)
    window.history.replaceState({}, '', '/login');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const expectedRole =
      selectedRole === 'admin' ? ('admin' as UserRole) : selectedRole;
    const { error: err, profile } = await signInWithRole(
      email,
      password,
      selectedRole === 'admin' ? undefined : expectedRole
    );
    setLoading(false);
    if (err || !profile) {
      setError(err ?? '로그인에 실패했습니다.');
      return;
    }
    if (selectedRole === 'admin' && profile.role !== 'admin' && profile.role !== 'teacher') {
      setError('원장/강사 계정으로 로그인해 주세요.');
      return;
    }
    const next =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
    router.push(next && next.startsWith('/') ? next : roleHomePath(profile.role));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6">
      <div className="absolute top-10 left-10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
          <i className="ri-bar-chart-box-fill text-white text-base"></i>
        </div>
        <span className="text-white text-lg font-bold">MathInsight</span>
      </div>
      <Link href="/" className="absolute top-10 right-10 text-sm text-slate-400 hover:text-white">
        홈으로
      </Link>

      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">로그인</h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          MathInsight에 오신 것을 환영합니다
        </p>

        {welcome && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-200 flex gap-2">
            <i className="ri-checkbox-circle-line text-emerald-400 shrink-0 mt-0.5"></i>
            <span>{welcome}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="rounded-2xl p-8 bg-slate-800/80 border border-slate-700 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">계정 유형</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-600 text-slate-400'
                  }`}
                >
                  <i className={`${role.icon} block mb-1`}></i>
                  {role.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
