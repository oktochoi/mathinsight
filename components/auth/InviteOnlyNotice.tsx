'use client';

import Link from 'next/link';
import { AuthPageScaffold } from '@/components/auth/AuthPageScaffold';
import { AuthFormCard } from '@/components/auth/AuthFormCard';

type Props = {
  role: 'parent' | 'student' | 'teacher';
  title?: string;
};

const COPY: Record<Props['role'], { headline: string; body: string }> = {
  parent: {
    headline: '학부모 계정은 초대로만 가입할 수 있어요',
    body: '학원에서 등록한 보호자 이메일로 초대 링크가 발송됩니다. 메일함을 확인하거나 학원에 문의해 주세요.',
  },
  student: {
    headline: '학생 계정은 학원 초대로만 활성화할 수 있어요',
    body: '학원에서 받은 QR·초대 링크 또는 로그인 코드로 처음 접속해 주세요. 자유 가입은 지원하지 않습니다.',
  },
  teacher: {
    headline: '강사·원무 계정은 학원 초대로만 가입할 수 있어요',
    body: '원장·원무가 보낸 이메일 초대 링크를 통해 가입해 주세요. 학원 코드만으로는 가입할 수 없습니다.',
  },
};

export function InviteOnlyNotice({ role, title }: Props) {
  const copy = COPY[role];
  return (
    <AuthPageScaffold>
      <AuthFormCard title={title ?? '초대 전용 가입'} subtitle={copy.headline}>
        <p className="text-sm mb-6" style={{ color: 'var(--auth-muted)' }}>
          {copy.body}
        </p>
        {role === 'student' ? (
          <Link href="/login/student" className="auth-submit-btn block text-center">
            학생 로그인 / 초대 활성화
          </Link>
        ) : (
          <Link href="/login" className="auth-submit-btn block text-center">
            학원 · 학부모 로그인
          </Link>
        )}
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--auth-muted)' }}>
          원장이신가요?{' '}
          <Link href="/signup" className="auth-link">
            학원 개설 가입
          </Link>
        </p>
      </AuthFormCard>
    </AuthPageScaffold>
  );
}
