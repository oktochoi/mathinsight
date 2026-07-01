export type ParentNavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

export const PARENT_MAIN_NAV: ParentNavItem[] = [
  { href: '/parent', label: '홈', icon: 'ri-home-4-line', exact: true },
  { href: '/parent/learning', label: '학습', icon: 'ri-book-open-line' },
  { href: '/parent/attendance', label: '출결', icon: 'ri-calendar-check-line' },
  { href: '/parent/notices', label: '공지', icon: 'ri-megaphone-line' },
];

export const PARENT_MORE_NAV: ParentNavItem[] = [
  { href: '/parent/payments', label: '수납', icon: 'ri-wallet-3-line' },
  { href: '/parent/schedule', label: '일정', icon: 'ri-calendar-line' },
  { href: '/parent/reports', label: '상담 리포트', icon: 'ri-file-text-line' },
  { href: '/parent/settings', label: '설정', icon: 'ri-settings-3-line' },
];

export const PARENT_SIDEBAR_NAV: ParentNavItem[] = [
  ...PARENT_MAIN_NAV,
  ...PARENT_MORE_NAV,
];

export const PARENT_BOTTOM_NAV: ParentNavItem[] = [
  ...PARENT_MAIN_NAV,
  { href: '/parent/more', label: '더보기', icon: 'ri-more-line' },
];
