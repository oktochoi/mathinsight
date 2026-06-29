import Link from 'next/link';

const NOTICES = [
  { tag: 'NEW', title: 'Lesson 마감·출결 ERP 연동 기능 오픈', date: '2026.05.20' },
  { tag: '공지', title: '학부모 AI 포털 24시간 문의 서비스 정식 운영', date: '2026.05.12' },
  { tag: '안내', title: '재등록 상담 큐 · 위험 신호 대시보드 업데이트', date: '2026.05.01' },
  { tag: '이벤트', title: '신규 학원 1개월 무료 체험 프로그램', date: '2026.04.28' },
];

const RESOURCES = [
  { tag: '가이드', title: 'EduFlow 도입 7일 온보딩 체크리스트', date: '2026.05.18' },
  { tag: '자료', title: '수업·상담 운영 매뉴얼 (PDF)', date: '2026.05.10' },
  { tag: '영상', title: '원장·강사·학부모 역할별 사용법', date: '2026.04.22' },
  { tag: 'FAQ', title: '기존 ClassUp·엑셀 데이터 이전 FAQ', date: '2026.04.15' },
];

function BoardColumn({
  title,
  items,
  moreHref,
}: {
  title: string;
  items: { tag: string; title: string; date: string }[];
  moreHref: string;
}) {
  return (
    <div className="corp-board-col">
      <div className="corp-board-head">
        <h2 className="corp-board-title">{title}</h2>
        <Link href={moreHref} className="corp-board-more" aria-label={`${title} 더보기`}>
          <i className="ri-add-line" aria-hidden />
        </Link>
      </div>
      <ul className="corp-board-list">
        {items.map((item) => (
          <li key={item.title}>
            <Link href="#" className="corp-board-row">
              <span className={`corp-board-tag corp-tag-${item.tag === 'NEW' ? 'new' : 'default'}`}>
                {item.tag}
              </span>
              <span className="corp-board-text">{item.title}</span>
              <span className="corp-board-date">{item.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingNoticeBoard() {
  return (
    <section className="corp-board-section" id="news">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="corp-board-grid">
          <BoardColumn title="공지사항" items={NOTICES} moreHref="#" />
          <BoardColumn title="자료실" items={RESOURCES} moreHref="#" />
        </div>
      </div>
    </section>
  );
}
