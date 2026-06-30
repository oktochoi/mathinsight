import Link from 'next/link';

export default function AppNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-base font-semibold" style={{ color: 'var(--app-ink)' }}>
        페이지를 찾을 수 없습니다
      </p>
      <p className="text-sm max-w-md" style={{ color: 'var(--app-ink-3)' }}>
        주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link href="/dashboard" className="app-btn app-btn-primary">
        오늘 현황으로
      </Link>
    </div>
  );
}
