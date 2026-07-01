export type StudentNavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

export const STUDENT_MAIN_NAV: StudentNavItem[] = [
  { href: '/student', label: '홈', icon: 'ri-home-4-line', exact: true },
  { href: '/student/learning', label: '학습', icon: 'ri-line-chart-line' },
  { href: '/student/homework', label: '숙제', icon: 'ri-task-line' },
  { href: '/student/notices', label: '공지', icon: 'ri-megaphone-line' },
];

export const STUDENT_MORE_NAV: StudentNavItem[] = [
  { href: '/student/exams', label: '시험', icon: 'ri-medal-line' },
  { href: '/student/schedule', label: '일정', icon: 'ri-calendar-line' },
  { href: '/student/history', label: '수업 기록', icon: 'ri-history-line' },
  { href: '/student/settings', label: '설정', icon: 'ri-settings-3-line' },
];

export const STUDENT_SIDEBAR_NAV: StudentNavItem[] = [
  ...STUDENT_MAIN_NAV,
  ...STUDENT_MORE_NAV,
];

export const STUDENT_BOTTOM_NAV: StudentNavItem[] = [
  ...STUDENT_MAIN_NAV,
  { href: '/student/more', label: '더보기', icon: 'ri-more-line' },
];
