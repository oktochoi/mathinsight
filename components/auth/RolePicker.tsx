'use client';

import type { SignupRole } from '@/lib/roles';

export const roleOptions: {
  label: string;
  value: SignupRole;
  icon: string;
  desc: string;
}[] = [
  {
    label: '원장 (학원 운영)',
    value: 'owner',
    icon: 'ri-user-star-line',
    desc: '학원을 새로 등록하고 운영합니다',
  },
  {
    label: '학부모',
    value: 'parent',
    icon: 'ri-parent-line',
    desc: '자녀 학습 현황을 확인합니다',
  },
  {
    label: '학생',
    value: 'student',
    icon: 'ri-graduation-cap-line',
    desc: '본인 학습 기록을 봅니다',
  },
];

type Props = {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  compact?: boolean;
};

export function RolePicker({ value, onChange, compact }: Props) {
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {roleOptions.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange(role.value)}
          className={`py-3 px-3 rounded-xl text-left border transition-all cursor-pointer ${
            value === role.value
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
              : 'border-slate-200/80 text-slate-600 bg-white/50 hover:border-indigo-200'
          }`}
        >
          <i className={`${role.icon} text-lg ${compact ? 'inline mr-2' : 'block mb-1'}`}></i>
          <span className="text-xs font-semibold">{role.label}</span>
          {!compact && (
            <p className="text-[10px] text-slate-500/90 mt-1 leading-snug">{role.desc}</p>
          )}
        </button>
      ))}
    </div>
  );
}
