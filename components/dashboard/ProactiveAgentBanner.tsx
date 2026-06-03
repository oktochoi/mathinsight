'use client';

export function ProactiveAgentBanner({
  consultation,
  makeup,
  attention,
}: {
  message: string;
  consultation: number;
  makeup: number;
  attention: number;
}) {
  const total = consultation + makeup + attention;
  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3.5">
      <p className="text-sm font-semibold text-violet-900">오늘 아침 자동 점검 결과</p>
      <p className="text-xs text-violet-800/90 mt-1">
        밤사이 수업 기록을 다시 훑어, 연락이 필요할 수 있는 학생 수를 정리했습니다.
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-slate-800">
        {consultation > 0 && (
          <li>
            상담 권장 <strong className="text-violet-800">{consultation}명</strong>
          </li>
        )}
        {makeup > 0 && (
          <li>
            보강 권장 <strong className="text-amber-800">{makeup}명</strong>
          </li>
        )}
        {attention > 0 && (
          <li>
            가벼운 주의 <strong className="text-sky-800">{attention}명</strong>
          </li>
        )}
      </ul>
    </div>
  );
}
