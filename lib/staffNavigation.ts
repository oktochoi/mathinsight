/** 학원 운영 IA — 업무 흐름 중심 Navigation (단일 출처) */

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  hidden?: boolean;
  requiredPermissions?: string[];
};

export type NavSection = {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
  /** 이 섹션 위에 구분선을 표시 */
  dividerAbove?: boolean;
};

export const PRODUCT_TAGLINE = 'AI 학원 운영 시스템';

export const TODAY_HUB_HREF = '/dashboard';

/**
 * 1차 메뉴 7개 — 업무 흐름 순서
 * 단일 item 섹션은 Sidebar에서 flat 링크로 렌더링
 * 다중 item 섹션은 accordion으로 렌더링
 */
export const STAFF_NAV_SECTIONS: NavSection[] = [
  {
    id: 'today',
    label: '오늘 현황',
    icon: 'ri-sun-line',
    items: [
      { label: '오늘 현황', href: '/dashboard', icon: 'ri-sun-line' },
    ],
  },
  {
    id: 'classes',
    label: '수업',
    icon: 'ri-book-open-line',
    items: [
      {
        label: '오늘 수업',
        href: '/lesson-logs',
        icon: 'ri-book-open-line',
        requiredPermissions: ['lessons.view'],
      },
      { label: '시간표', href: '/schedule', icon: 'ri-calendar-line' },
    ],
  },
  {
    id: 'students',
    label: '학생',
    icon: 'ri-group-line',
    items: [
      {
        label: '학생',
        href: '/students',
        icon: 'ri-group-line',
        requiredPermissions: ['students.view'],
      },
    ],
  },
  {
    id: 'parents',
    label: '상담 & 학부모',
    icon: 'ri-chat-check-line',
    items: [
      {
        label: '상담 카드',
        href: '/consultation-cards',
        icon: 'ri-chat-check-line',
        requiredPermissions: ['counseling.view'],
      },
      {
        label: '학부모 전달',
        href: '/parent-reports',
        icon: 'ri-file-text-line',
        requiredPermissions: ['parent_comms.view'],
      },
    ],
  },
  {
    id: 'operations',
    label: '수납',
    icon: 'ri-wallet-3-line',
    items: [
      {
        label: '수납 관리',
        href: '/billing',
        icon: 'ri-wallet-3-line',
        requiredPermissions: ['billing.view'],
      },
      {
        label: '학생 성장',
        href: '/retention',
        icon: 'ri-refresh-line',
        requiredPermissions: ['retention.view'],
      },
    ],
  },
  {
    id: 'reports',
    label: '운영 분석',
    icon: 'ri-bar-chart-2-line',
    dividerAbove: true,
    items: [
      { label: '운영 분석', href: '/analytics', icon: 'ri-bar-chart-2-line' },
    ],
  },
  {
    id: 'settings',
    label: '설정',
    icon: 'ri-settings-3-line',
    items: [
      {
        label: '설정',
        href: '/settings',
        icon: 'ri-settings-3-line',
        requiredPermissions: ['settings.academy'],
      },
    ],
  },
];

/** @deprecated 그룹 구조 — Sidebar는 STAFF_NAV_SECTIONS 사용 */
export const STAFF_NAV_GROUPS = STAFF_NAV_SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
  items: s.items,
}));

export const QUICK_ACTIONS = [
  { label: '학생 등록', href: '/students', icon: 'ri-user-add-line' },
  { label: '오늘 수업', href: '/lesson-logs', icon: 'ri-book-open-line' },
  { label: '청구 등록', href: '/billing', icon: 'ri-wallet-3-line' },
  { label: '상담 작성', href: '/consultation-cards', icon: 'ri-chat-check-line' },
] as const;

const PATH_SECTION_MAP: { prefix: string; sectionId: string }[] = [
  { prefix: '/dashboard', sectionId: 'today' },
  { prefix: '/lesson-logs', sectionId: 'classes' },
  { prefix: '/schedule', sectionId: 'classes' },
  { prefix: '/curriculum', sectionId: 'classes' },
  { prefix: '/homework', sectionId: 'classes' },
  { prefix: '/attendance', sectionId: 'classes' },
  { prefix: '/grades', sectionId: 'classes' },
  { prefix: '/students', sectionId: 'students' },
  { prefix: '/counseling', sectionId: 'parents' },
  { prefix: '/consultation-cards', sectionId: 'parents' },
  { prefix: '/parent-reports', sectionId: 'parents' },
  { prefix: '/parent-hub', sectionId: 'parents' },
  { prefix: '/messages', sectionId: 'parents' },
  { prefix: '/notices', sectionId: 'parents' },
  { prefix: '/billing', sectionId: 'operations' },
  { prefix: '/retention', sectionId: 'operations' },
  { prefix: '/notifications', sectionId: 'operations' },
  { prefix: '/analytics', sectionId: 'reports' },
  { prefix: '/student-growth', sectionId: 'reports' },
  { prefix: '/settings', sectionId: 'settings' },
  { prefix: '/onboarding', sectionId: 'settings' },
  { prefix: '/integrations', sectionId: 'settings' },
];

export function getActiveSectionId(pathname: string): string | null {
  const match = PATH_SECTION_MAP.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  return match?.sectionId ?? null;
}

export function isNavItemActive(pathname: string, search: string, href: string): boolean {
  const [path, query] = href.split('?');
  if (pathname !== path && !pathname.startsWith(path + '/')) {
    if (path === '/students' && pathname.startsWith('/students/')) return href === '/students';
    if (path === '/counseling' && pathname.startsWith('/counseling')) return href === '/counseling';
    if (path === '/schedule' && pathname.startsWith('/schedule')) {
      return href === '/schedule' ? pathname === '/schedule' : pathname.startsWith('/schedule/');
    }
    if (path === '/retention' && pathname.startsWith('/retention')) return href === '/retention';
    if (path === '/billing' && pathname.startsWith('/billing')) return href === '/billing';
    if (path === '/parent-reports' && pathname.startsWith('/parent-reports'))
      return href === '/parent-reports';
    if (path === '/consultation-cards' && pathname.startsWith('/consultation-cards'))
      return href === '/consultation-cards';
    return false;
  }
  if (!query) {
    if (path === '/students' && search.includes('tab=')) return false;
    if (path === '/counseling' && (search.includes('view=') || search.includes('step=')))
      return href === '/counseling';
    if (path === '/settings' && search.includes('tab=')) return href === '/settings';
    if (path === '/schedule/prep') return pathname === '/schedule/prep';
    if (path === '/schedule') return pathname === '/schedule';
    return pathname === path || (path === '/students' && pathname.startsWith('/students/'));
  }
  const params = new URLSearchParams(query);
  const current = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const [k, v] of params.entries()) {
    if (current.get(k) !== v) return false;
  }
  return true;
}

export function isSectionActive(pathname: string, search: string, section: NavSection): boolean {
  return section.items.some(
    (item) => !item.hidden && isNavItemActive(pathname, search, item.href)
  );
}
