'use client';

import { cn } from '@/lib/cn';

export type AuthAudience = 'staff' | 'student';

const OPTIONS: { key: AuthAudience; label: string }[] = [
  { key: 'staff', label: '일반 로그인' },
  { key: 'student', label: '학생 로그인' },
];

export function authLoginPlaceholder(): string {
  return 'you@academy.kr';
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
