'use client';

type Props = {
  lessonScheduled: boolean;
  noLesson: boolean;
  selectedClassId: string;
  onStartLesson?: () => void;
  starting?: boolean;
};

export function LessonStatusBanners({
  lessonScheduled,
  noLesson,
  selectedClassId,
  onStartLesson,
  starting = false,
}: Props) {
  return (
    <>
      {lessonScheduled && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3 app-banner-warning">
          <i className="ri-information-line text-lg mt-0.5" style={{ color: 'var(--app-warning)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">수업을 먼저 시작해 주세요.</p>
            <p className="text-xs mt-0.5 opacity-90">
              수업을 시작하면 출결·숙제·점수를 기록할 수 있습니다.
            </p>
            {onStartLesson && (
              <button
                type="button"
                onClick={onStartLesson}
                disabled={starting}
                className="app-btn app-btn-primary text-xs mt-3 disabled:opacity-50"
              >
                {starting ? '시작 중…' : '수업 시작'}
              </button>
            )}
          </div>
        </div>
      )}

      {noLesson && selectedClassId && (
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
        >
          <i className="ri-calendar-line text-lg mt-0.5" style={{ color: 'var(--app-ink-4)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--app-ink-2)' }}>
              이 날짜에 수업이 없습니다.
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
              아래 버튼으로 수업을 만들고 바로 시작할 수 있습니다.
            </p>
            {onStartLesson && (
              <button
                type="button"
                onClick={onStartLesson}
                disabled={starting}
                className="app-btn app-btn-primary text-xs mt-3 disabled:opacity-50"
              >
                {starting ? '만드는 중…' : '수업 만들기 · 시작'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
