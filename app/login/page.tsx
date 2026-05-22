'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithRole, roleHomePath } from '@/lib/auth';
import type { UserRole } from '@/types/database';
import { AuthPageShell } from '@/components/auth/AuthPageShell';

const roles: { label: string; value: UserRole; icon: string }[] = [
  { label: '원장/강사', value: 'admin', icon: 'ri-user-star-line' },
  { label: '학부모', value: 'parent', icon: 'ri-parent-line' },
  { label: '학생', value: 'student', icon: 'ri-graduation-cap-line' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-indigo-100/80 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-shadow';

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
    <AuthPageShell title="로그인" subtitle="MathInsight에 다시 오신 것을 환영해요">
      {welcome && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 text-sm text-emerald-800 flex gap-2">
          <i className="ri-checkbox-circle-line text-emerald-500 shrink-0 mt-0.5"></i>
          <span>{welcome}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
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
        <div>
          <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">계정 유형</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedRole === role.value
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200/80 text-slate-500 bg-white/50 hover:border-indigo-200'
                }`}
              >
                <i className={`${role.icon} block mb-1 text-base`}></i>
                {role.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="soft-btn-primary w-full disabled:opacity-50 cursor-pointer"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="text-center text-xs text-slate-500/90 mt-6">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </AuthPageShell>
  );
}
