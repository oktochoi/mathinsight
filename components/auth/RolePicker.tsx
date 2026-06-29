'use client';

import type { SignupRole } from '@/lib/roles';

export const roleOptions: {
  label: string;
  value: SignupRole;
  icon: string;
  desc: string;
  color: string;
}[] = [
  {
    label: '원장',
    value: 'owner',
    icon: 'ri-building-2-line',
    desc: '학원 개설·운영',
    color: 'blue',
  },
  {
    label: '강사',
    value: 'teacher',
    icon: 'ri-user-star-line',
    desc: '수업·학생 관리',
    color: 'violet',
  },
  {
    label: '학부모',
    value: 'parent',
    icon: 'ri-parent-line',
    desc: '자녀 학습 확인',
    color: 'emerald',
  },
  {
    label: '학생',
    value: 'student',
    icon: 'ri-graduation-cap-line',
    desc: '내 학습 기록',
    color: 'amber',
  },
];

const colorMap = {
  blue: {
    active: 'border-blue-400 bg-blue-50 text-blue-700',
    icon: 'text-blue-500',
    inactive: 'border-slate-200 text-slate-600 hover:border-blue-200',
  },
  violet: {
    active: 'border-violet-400 bg-violet-50 text-violet-700',
    icon: 'text-violet-500',
    inactive: 'border-slate-200 text-slate-600 hover:border-violet-200',
  },
  emerald: {
    active: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    icon: 'text-emerald-500',
    inactive: 'border-slate-200 text-slate-600 hover:border-emerald-200',
  },
  amber: {
    active: 'border-amber-400 bg-amber-50 text-amber-700',
    icon: 'text-amber-500',
    inactive: 'border-slate-200 text-slate-600 hover:border-amber-200',
  },
};

type Props = {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
};

export function RolePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {roleOptions.map((role) => {
        const colors = colorMap[role.color as keyof typeof colorMap];
        const isActive = value === role.value;
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`relative flex flex-col items-start gap-1 px-3.5 py-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
              isActive ? colors.active : `bg-white/50 ${colors.inactive}`
            }`}
          >
            {isActive && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-current flex items-center justify-center">
                <i className="ri-check-line text-[10px] text-white" />
              </span>
            )}
            <i className={`${role.icon} text-xl ${isActive ? '' : colors.icon}`} />
            <span className="text-xs font-bold leading-tight">{role.label}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{role.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
