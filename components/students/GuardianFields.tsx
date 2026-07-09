'use client';

import type { GuardianInput } from '@/lib/studentRegistration';

const RELATIONSHIP_OPTIONS: { value: GuardianInput['relationship']; label: string }[] = [
  { value: 'mother', label: '엄마' },
  { value: 'father', label: '아빠' },
  { value: 'guardian', label: '보호자' },
  { value: 'other', label: '기타' },
];

type Props = {
  guardians: GuardianInput[];
  onChange: (guardians: GuardianInput[]) => void;
  allowEmpty?: boolean;
};

export function GuardianFields({ guardians, onChange, allowEmpty = false }: Props) {
  const update = (index: number, patch: Partial<GuardianInput>) => {
    onChange(guardians.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const remove = (index: number) => {
    if (!allowEmpty && guardians.length <= 1) return;
    onChange(guardians.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...guardians, { name: '', relationship: 'mother', phone: '', email: '' }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--app-ink-2)' }}>
          보호자
        </p>
        <button type="button" onClick={add} className="text-xs font-medium" style={{ color: 'var(--app-accent)' }}>
          + 보호자 추가
        </button>
      </div>
      {guardians.map((g, i) => (
        <div
          key={i}
          className="rounded-xl p-3 space-y-2"
          style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="이름"
              value={g.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="px-2 py-1.5 rounded-lg text-sm border"
              style={{ borderColor: 'var(--app-border)' }}
            />
            <select
              value={g.relationship}
              onChange={(e) =>
                update(i, { relationship: e.target.value as GuardianInput['relationship'] })
              }
              className="px-2 py-1.5 rounded-lg text-sm border"
              style={{ borderColor: 'var(--app-border)' }}
            >
              {RELATIONSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="휴대폰 (010…)"
              value={g.phone}
              onChange={(e) => update(i, { phone: e.target.value })}
              className="flex-1 px-2 py-1.5 rounded-lg text-sm border"
              style={{ borderColor: 'var(--app-border)' }}
            />
            {(allowEmpty || guardians.length > 1) && (
              <button type="button" onClick={() => remove(i)} className="text-xs text-rose-600 px-2">
                삭제
              </button>
            )}
          </div>
          <input
            type="email"
            placeholder="이메일 (학부모 초대용)"
            value={g.email ?? ''}
            onChange={(e) => update(i, { email: e.target.value })}
            className="w-full px-2 py-1.5 rounded-lg text-sm border"
            style={{ borderColor: 'var(--app-border)' }}
          />
        </div>
      ))}
      <p className="text-[11px]" style={{ color: 'var(--app-ink-4)' }}>
        보호자 이메일로 학부모 초대 링크가 발송됩니다. 휴대폰은 연락·SMS용입니다.
      </p>
    </div>
  );
}
