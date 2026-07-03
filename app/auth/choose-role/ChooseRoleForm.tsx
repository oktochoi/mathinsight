'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { completeProfileSetup, postAuthPath } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { toDbRole } from '@/lib/roles';
import type { SignupRole } from '@/lib/roles';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import {
  AuthField,
  AuthInput,
  AuthSubmitButton,
} from '@/components/auth/AuthField';
import { RolePicker } from '@/components/auth/RolePicker';

type Props = {
  initialName: string;
  showPendingInfo: boolean;
};

export function ChooseRoleForm({ initialName, showPendingInfo }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState<SignupRole>('owner');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const { error: err, profile } = await completeProfileSetup({
      role,
      name: name.trim(),
    });
    setSubmitting(false);

    if (err || !profile) {
      setError(err ?? '설정을 저장하지 못했습니다.');
      toast.error(err ?? '설정을 저장하지 못했습니다.');
      return;
    }

    toast.success('설정이 완료되었습니다.');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(postAuthPath(user, profile, toDbRole(profile.role)));
  };

  return (
    <AuthPageScaffold>
      <AuthFormCard title="역할 선택" subtitle="EduFlow에서 어떻게 이용하실지 알려 주세요">
        {showPendingInfo && (
          <div className="auth-info-banner mb-4 text-sm">
            가입이 거의 끝났습니다. 역할을 선택하고 시작하기를 눌러 주세요.
          </div>
        )}

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="이름">
            <AuthInput value={name} onChange={(e) => setName(e.target.value)} required />
          </AuthField>

          <AuthField label="계정 유형">
            <RolePicker value={role} onChange={setRole} />
          </AuthField>

          <AuthSubmitButton loading={submitting}>
            {submitting ? '저장 중...' : '시작하기'}
          </AuthSubmitButton>
        </form>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
