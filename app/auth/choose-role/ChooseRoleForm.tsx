'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { completeProfileSetup, postAuthPath } from '@/lib/auth';
import type { SignupRole } from '@/lib/roles';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { RolePicker } from '@/components/auth/RolePicker';

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-white/80 border border-indigo-100/80 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-shadow';

type Props = {
  initialName: string;
  showPendingInfo: boolean;
};

export function ChooseRoleForm({ initialName, showPendingInfo }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState<SignupRole>('parent');
  const [academyName, setAcademyName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }
    if (role === 'owner' && !academyName.trim()) {
      setError('학원 이름을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const { error: err, profile } = await completeProfileSetup({
      role,
      name: name.trim(),
      academyName: role === 'owner' ? academyName : undefined,
    });
    setSubmitting(false);

    if (err || !profile) {
      setError(err ?? '설정을 저장하지 못했습니다.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    router.replace(user ? postAuthPath(user, profile) : '/dashboard');
  };

  return (
    <AuthPageShell
      title="역할 선택"
      subtitle="EduFlow에서 어떻게 이용하실지 알려 주세요"
    >
      {showPendingInfo && (
        <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-200/80 px-4 py-3 text-sm text-indigo-800">
          가입이 거의 끝났습니다. 아래에서 원장·학부모·학생 중 역할을 선택하고 시작하기를
          눌러 주세요.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">계정 유형</label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        {role === 'owner' && (
          <div>
            <label className="soft-label text-[10px] block mb-2 text-indigo-500/80">학원 이름</label>
            <input
              value={academyName}
              onChange={(e) => setAcademyName(e.target.value)}
              className={inputClass}
              placeholder="예: 옥토수학학원"
              required
            />
            <p className="text-xs text-slate-500/90 mt-2 leading-relaxed">
              학원 프로필과 기본 반(A반)이 자동으로 만들어집니다.
            </p>
          </div>
        )}

        {(role === 'parent' || role === 'student') && (
          <p className="text-xs text-slate-500/90 leading-relaxed px-1">
            학원에서 자녀·학생 연결 후 데이터를 볼 수 있습니다. 연결 전에도 계정은 만들어집니다.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="soft-btn-primary w-full disabled:opacity-50 cursor-pointer"
        >
          {submitting ? '저장 중...' : '시작하기'}
        </button>
      </form>
    </AuthPageShell>
  );
}
