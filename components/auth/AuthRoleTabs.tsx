'use client';

import { cn } from '@/lib/cn';

export type AuthAudience = 'staff' | 'parent' | 'student';

const OPTIONS: { key: AuthAudience; label: string }[] = [
  { key: 'staff', label: '원장·강사' },
  { key: 'parent', label: '학부모' },
  { key: 'student', label: '학생' },
];

export function authAudienceHint(audience: AuthAudience): string {
  if (audience === 'staff') return '휴대폰 번호 또는 Google 계정으로 로그인합니다.';
  return '가입 시 인증한 휴대폰 번호로 로그인합니다.';
}

export function authLoginPlaceholder(audience: AuthAudience): string {
  if (audience === 'staff') return '휴대폰 번호 (01012345678)';
  return '휴대폰 번호 (01012345678)';
}

export function AuthRoleTabs({
  value,
  onChange,
}: {
  value: AuthAudience;
  onChange: (value: AuthAudience) => void;
}) {
  return (
    <div className="auth-role-tabs" role="tablist" aria-label="로그인 유형">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={cn('auth-role-tab', value === opt.key && 'auth-role-tab-active')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
