import Link from 'next/link';

const QUICK_LINKS = [
  { href: '#services', icon: 'ri-play-circle-line', label: '서비스\n가이드' },
  { href: '#trial', icon: 'ri-price-tag-3-line', label: '요금\n안내' },
  { href: '#support', icon: 'ri-question-answer-line', label: '자주 묻는\n질문' },
  { href: '/signup', icon: 'ri-mail-send-line', label: '도입\n문의' },
  { href: '/parent', icon: 'ri-parent-line', label: '학부모\n포털' },
  { href: '/auth', icon: 'ri-building-4-line', label: '원장·강사\n로그인' },
  { href: '#support', icon: 'ri-customer-service-2-line', label: '온라인\n상담' },
];

export function LandingQuickAccess() {
  return (
    <section className="corp-quick-access" aria-label="빠른 메뉴">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="corp-quick-grid">
          {QUICK_LINKS.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="corp-quick-item">
                <span className="corp-quick-icon">
                  <i className={item.icon} aria-hidden />
                </span>
                <span className="corp-quick-label whitespace-pre-line">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
