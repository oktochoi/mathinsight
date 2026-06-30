'use client';

import {
  PLAN_LABEL,
  PLAN_PRICE_KRW,
  PLAN_STUDENT_LIMIT,
  type PlanId,
} from '@/lib/payment/types';
import { cn } from '@/lib/cn';

const PLANS: PlanId[] = ['starter', 'growth', 'pro'];

const HIGHLIGHTS: Record<PlanId, string[]> = {
  starter: ['학생 50명', '기본 ERP', '학부모 포털'],
  growth: ['학생 150명', 'AI 상담 요약', '우선 지원'],
  pro: ['학생 무제한', '전 기능', '전담 온보딩'],
};

export function PlanSelector({
  selected,
  onSelect,
}: {
  selected: PlanId;
  onSelect: (plan: PlanId) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PLANS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            'text-left rounded-2xl border-2 p-5 transition-all cursor-pointer',
            selected === id
              ? 'border-indigo-500 bg-indigo-50/80 shadow-md'
              : 'border-stone-200 bg-white hover:border-indigo-200'
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
            {PLAN_LABEL[id]}
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1">
            {PLAN_PRICE_KRW[id].toLocaleString('ko-KR')}
            <span className="text-sm font-medium text-stone-500">원/월</span>
          </p>
          <p className="text-xs text-stone-500 mt-1">학생 {PLAN_STUDENT_LIMIT[id]}</p>
          <ul className="mt-4 space-y-1.5">
            {HIGHLIGHTS[id].map((line) => (
              <li key={line} className="text-xs text-stone-600 flex items-center gap-1.5">
                <i className="ri-check-line text-indigo-500" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}
