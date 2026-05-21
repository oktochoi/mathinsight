'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpWithRole, type SignupRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const roles: { label: string; value: SignupRole; icon: string; desc: string }[] = [
  {
    label: '원장/강사',
    value: 'admin',
    icon: 'ri-user-star-line',
    desc: '학원을 새로 등록합니다',
  },
  {
    label: '학부모',
    value: 'parent',
    icon: 'ri-parent-line',
    desc: '자녀 학습 현황을 봅니다',
  },
  {
    label: '학생',
    value: 'student',
    icon: 'ri-graduation-cap-line',
    desc: '본인 학습 기록을 봅니다',
  },
];

const roleCopy: Record<
  SignupRole,
  { title: string; subtitle: string; namePlaceholder: string }
> = {
  admin: {
    title: '회원가입',
    subtitle: '가입 후 로그인 페이지에서 로그인합니다',
    namePlaceholder: '원장 이름',
  },
  parent: {
    title: '회원가입',
    subtitle: '가입 후 로그인 페이지에서 로그인합니다',
    namePlaceholder: '보호자 이름',
  },
  student: {
    title: '회원가입',
    subtitle: '가입 후 로그인 페이지에서 로그인합니다',
    namePlaceholder: '학생 이름',
  },
};

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<SignupRole>('admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const copy = roleCopy[selectedRole];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!name || !email) {
      setError('이름과 이메일을 입력해 주세요.');
      return;
    }
    if (selectedRole === 'admin' && !academyName.trim()) {
      setError('학원 이름을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: err, needsEmailConfirmation } = await signUpWithRole({
        email,
        password,
        name,
        role: selectedRole,
        academyName: selectedRole === 'admin' ? academyName : undefined,
      });

      if (err) {
        setError(err);
        return;
      }

      // 가입 직후 자동 로그인 세션 제거 → 로그인 화면에서 명확히 로그인
      await supabase.auth.signOut();

      const params = new URLSearchParams({
        registered: '1',
        email,
        role: selectedRole,
      });
      if (needsEmailConfirmation) {
        params.set('confirm', '1');
      }

      router.push(`/login?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-6 py-12">
      <Link
        href="/"
        className="absolute top-10 right-10 text-sm text-slate-400 hover:text-white"
      >
        홈으로
      </Link>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">{copy.title}</h1>
        <p className="text-slate-400 text-sm text-center mb-6">{copy.subtitle}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
            {error.includes('너무 많') && (
              <p className="mt-2 text-xs text-red-200/90">
                잠시 후 다시 시도하거나{' '}
                <Link href="/login" className="underline">
                  로그인
                </Link>
                을 이용해 주세요.
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          className="rounded-2xl p-8 bg-slate-800/80 border border-slate-700 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              가입 유형
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <i className={`${role.icon} text-base`}></i>
                  {role.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              {roles.find((r) => r.value === selectedRole)?.desc}
            </p>
          </div>

          <input
            placeholder={copy.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm"
            required
          />

          {selectedRole === 'admin' && (
            <input
              placeholder="학원 이름"
              value={academyName}
              onChange={(e) => setAcademyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm"
              required
            />
          )}

          {(selectedRole === 'parent' || selectedRole === 'student') && (
            <p className="text-xs text-slate-400 leading-relaxed px-1">
              별도 「프로필」 입력은 없습니다. 이름·이메일로 계정이 만들어지며, 학원에서 자녀 연결 후
              데이터를 볼 수 있습니다.
            </p>
          )}
          {selectedRole === 'admin' && (
            <p className="text-xs text-slate-400 leading-relaxed px-1">
              학원 이름과 함께 원장 프로필·기본 반(A반)이 자동 생성됩니다.
            </p>
          )}

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm"
            required
          />
          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm"
            required
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {loading ? '가입 처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
