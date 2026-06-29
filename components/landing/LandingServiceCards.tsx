import Link from 'next/link';

const SERVICES = [
  {
    icon: 'ri-calendar-todo-line',
    title: '수업·출결 운영',
    desc: 'Lesson 단위로 출결·마감 상태를 관리하고, 강사별 오늘 수업 큐를 제공합니다.',
    primary: { href: '#trial', label: '체험 신청' },
    secondary: { href: '#news', label: '자세히' },
  },
  {
    icon: 'ri-file-list-3-line',
    title: '숙제·성적 관리',
    desc: '숙제·시험 점수를 수업 기록과 연결해 학부모 리포트와 AI 답변의 근거로 씁니다.',
    primary: { href: '/auth', label: '데모 보기' },
    secondary: { href: '#news', label: '자세히' },
  },
  {
    icon: 'ri-chat-heart-line',
    title: '상담·재등록',
    desc: '위험 신호 → 상담 대상 큐 → 재등록 기록까지 한 흐름으로 이어집니다.',
    primary: { href: '/signup', label: '도입 문의' },
    secondary: { href: '#news', label: '자세히' },
  },
  {
    icon: 'ri-robot-2-line',
    title: '학부모 AI 포털',
    desc: '24시간 자녀 학습·진도·상담 맥락을 질문하고, 학원이 승인한 데이터만 답합니다.',
    primary: { href: '/parent', label: '포털 이동' },
    secondary: { href: '#news', label: '자세히' },
  },
  {
    icon: 'ri-dashboard-3-line',
    title: '원장 대시보드',
    desc: '미마감 수업, 상담 대기, 재등록 위험 학생을 역할별 보드에서 한눈에 확인합니다.',
    primary: { href: '/auth', label: '로그인' },
    secondary: { href: '#news', label: '자세히' },
  },
];

export function LandingServiceCards() {
  return (
    <section id="services" className="corp-services scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="corp-services-heading">
          <span className="corp-services-bar" aria-hidden />
          {` EduFlow 주요 서비스`}
        </h2>
        <div className="corp-services-grid">
          {SERVICES.map((svc) => (
            <article key={svc.title} className="corp-service-card">
              <div className="corp-service-icon-wrap">
                <i className={svc.icon} aria-hidden />
              </div>
              <h3 className="corp-service-title">{svc.title}</h3>
              <p className="corp-service-desc">{svc.desc}</p>
              <div className="corp-service-actions">
                <Link href={svc.primary.href} className="corp-service-btn-primary">
                  {svc.primary.label}
                </Link>
                <Link href={svc.secondary.href} className="corp-service-btn-secondary">
                  {svc.secondary.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
