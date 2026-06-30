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
      {
        label: '출결',
        href: '/attendance',
        icon: 'ri-calendar-check-line',
        requiredPermissions: ['lessons.view'],
      },
      {
        label: '성적',
        href: '/grades',
        icon: 'ri-bar-chart-box-line',
        requiredPermissions: ['students.view'],
      },
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
    id: 'homerooms',
    label: '반',
    icon: 'ri-building-4-line',
    items: [
      {
        label: '반 관리',
        href: '/classes',
        icon: 'ri-building-4-line',
        requiredPermissions: ['students.view'],
      },
    ],
  },
  {
    id: 'parents',
    label: '학부모',
    icon: 'ri-parent-line',
    items: [
      {
        label: '학부모 연결',
        href: '/students?tab=parents',
        icon: 'ri-link',
        requiredPermissions: ['students.view'],
      },
      {
        label: '공지',
        href: '/notices',
        icon: 'ri-megaphone-line',
        requiredPermissions: ['parent_comms.view'],
      },
      {
        label: '문의함',
        href: '/messages',
        icon: 'ri-mail-send-line',
        requiredPermissions: ['parent_comms.view'],
      },
    ],
  },
  {
    id: 'counseling',
    label: '상담',
    icon: 'ri-chat-smile-3-line',
    items: [
      {
        label: '상담',
        href: '/counseling',
        icon: 'ri-chat-smile-3-line',
        requiredPermissions: ['counseling.view'],
      },
      {
        label: '학부모 리포트',
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
    ],
  },
  {
    id: 'reports',
    label: '경영',
    icon: 'ri-pie-chart-2-line',
    dividerAbove: true,
    items: [
      { label: '경영 리포트', href: '/analytics', icon: 'ri-pie-chart-2-line' },
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
      {
        label: '문자·알림',
        href: '/notifications',
        icon: 'ri-notification-3-line',
        requiredPermissions: ['settings.academy'],
      },
    ],
  },
];

export const QUICK_ACTIONS = [
  { label: '학생 등록', href: '/students', icon: 'ri-user-add-line' },
  { label: '오늘 수업', href: '/lesson-logs', icon: 'ri-book-open-line' },
  { label: '청구 등록', href: '/billing', icon: 'ri-wallet-3-line' },
  { label: '상담 작성', href: '/counseling', icon: 'ri-chat-smile-3-line' },
] as const;

/** 사이드바 메뉴에서 자동 생성 */
const NAV_PATH_SECTION_MAP = STAFF_NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    prefix: item.href.split('?')[0],
    sectionId: section.id,
  }))
);

/** 하위·연관 경로만 수동 보강 (사이드바에 없는 실제 페이지) */
const EXTRA_PATH_SECTION_MAP: { prefix: string; sectionId: string }[] = [
  { prefix: '/consultation-cards', sectionId: 'counseling' },
  { prefix: '/schedule/prep', sectionId: 'classes' },
  { prefix: '/notifications', sectionId: 'settings' },
  { prefix: '/integrations', sectionId: 'settings' },
];

const PATH_SECTION_MAP = [...NAV_PATH_SECTION_MAP, ...EXTRA_PATH_SECTION_MAP];

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
    if (path === '/classes' && pathname.startsWith('/classes')) return href === '/classes';
    if (path === '/billing' && pathname.startsWith('/billing')) return href === '/billing';
    if (path === '/parent-reports' && pathname.startsWith('/parent-reports'))
      return href === '/parent-reports';
    if (path === '/attendance' && pathname.startsWith('/attendance')) return href === '/attendance';
    if (path === '/grades' && pathname.startsWith('/grades')) return href === '/grades';
    if (path === '/notifications' && pathname.startsWith('/notifications'))
      return href === '/notifications';
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
