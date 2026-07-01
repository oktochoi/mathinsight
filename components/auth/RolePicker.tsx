'use client';

import type { SignupRole } from '@/lib/roles';
import { cn } from '@/lib/cn';

export const roleOptions: {
  label: string;
  value: SignupRole;
  icon: string;
  desc: string;
}[] = [
  {
    label: '원장',
    value: 'owner',
    icon: 'ri-building-2-line',
    desc: '학원 개설·운영',
  },
  {
    label: '강사',
    value: 'teacher',
    icon: 'ri-user-star-line',
    desc: '수업·학생 관리',
  },
  {
    label: '학부모',
    value: 'parent',
    icon: 'ri-parent-line',
    desc: '자녀 학습 확인',
  },
  {
    label: '학생',
    value: 'student',
    icon: 'ri-graduation-cap-line',
    desc: '내 학습 기록',
  },
];

type Props = {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
};

export function RolePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {roleOptions.map((role) => {
        const isActive = value === role.value;
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={cn(
              'relative flex flex-col items-start gap-1 rounded-xl border-2 px-3.5 py-3.5 text-left transition-all cursor-pointer',
              isActive
                ? 'border-[var(--auth-accent)] bg-[var(--auth-accent-bg)] text-[var(--auth-accent-text)]'
                : 'border-[var(--auth-border)] bg-white/60 text-[var(--auth-ink)] hover:border-[var(--app-accent-border)]'
            )}
          >
            {isActive && (
              <span
                className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: 'var(--auth-accent)', color: '#fff' }}
              >
                <i className="ri-check-line text-[10px]" />
              </span>
            )}
            <i
              className={cn(role.icon, 'text-xl')}
              style={{ color: isActive ? 'var(--auth-accent)' : 'var(--auth-muted)' }}
            />
            <span className="text-xs font-bold leading-tight">{role.label}</span>
            <span className="text-[10px] leading-tight" style={{ color: 'var(--auth-muted)' }}>
              {role.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
