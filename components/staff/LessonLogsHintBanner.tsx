import Link from 'next/link';

type Props = {
  /** 예: 출결, 숙제 */
  context: string;
};

/** attendance·homework(일일)가 lesson_logs와 동일 소스임을 안내 */
export function LessonLogsHintBanner({ context }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{
        borderColor: 'var(--app-accent-border)',
        background: 'var(--app-accent-bg)',
        color: 'var(--app-ink-2)',
      }}
    >
      <p>
        <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>
          {context}
        </span>
        은 오늘 수업 기록과 같은 데이터를 편집합니다. 출결·숙제·점수·메모를 한 번에
        입력하려면 오늘 수업을 이용하세요.
      </p>
      <Link
        href="/lesson-logs"
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
        style={{ background: 'var(--app-accent)' }}
      >
        오늘 수업 열기
      </Link>
    </div>
  );
}
