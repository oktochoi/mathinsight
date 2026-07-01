const PAGE_SCROLL_KEY = 'eduflow_students_page_scroll';
const SIDEBAR_SCROLL_KEY = 'eduflow_students_sidebar_scroll';

export function saveStudentsPageScroll(y: number) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PAGE_SCROLL_KEY, String(Math.max(0, Math.round(y))));
}

export function readStudentsPageScroll(): number | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PAGE_SCROLL_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function saveStudentsSidebarScroll(y: number) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(Math.max(0, Math.round(y))));
}

export function readStudentsSidebarScroll(): number | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
