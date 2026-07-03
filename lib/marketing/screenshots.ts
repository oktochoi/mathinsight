/** 스크린샷 교체용 레지스트리 — src만 채우면 UI 변경 없이 이미지 교체 */

export type ScreenshotKey =
  | 'dashboard'
  | 'student-hub'
  | 'today-lesson'
  | 'counseling'
  | 'parent-report'
  | 'reregistration'
  | 'billing'
  | 'teacher'
  | 'ai-summary'
  | 'ai-risk'
  | 'ai-counseling-card'
  | 'ai-parent-report'
  | 'hero';

export type ScreenshotSpec = {
  label: string;
  /** 실제 이미지 URL — 제공 시 placeholder 대신 표시 */
  src?: string;
  alt?: string;
  width: number;
  height: number;
};

export const SCREENSHOTS: Record<ScreenshotKey, ScreenshotSpec> = {
  hero: {
    label: 'Counseling Dashboard',
    width: 1280,
    height: 720,
  },
  dashboard: {
    label: 'Dashboard',
    width: 1280,
    height: 720,
  },
  'student-hub': {
    label: 'Student Hub',
    width: 1280,
    height: 720,
  },
  'today-lesson': {
    label: 'Today Lesson',
    width: 1280,
    height: 720,
  },
  counseling: {
    label: 'Counseling',
    width: 1280,
    height: 720,
  },
  'parent-report': {
    label: 'Parent Report',
    width: 1280,
    height: 720,
  },
  reregistration: {
    label: 'Re-registration',
    width: 1280,
    height: 720,
  },
  billing: {
    label: 'Billing',
    width: 1280,
    height: 720,
  },
  teacher: {
    label: 'Teacher Dashboard',
    width: 1280,
    height: 720,
  },
  'ai-summary': {
    label: 'AI Student Summary',
    width: 1280,
    height: 720,
  },
  'ai-risk': {
    label: 'Risk Snapshot',
    width: 1280,
    height: 720,
  },
  'ai-counseling-card': {
    label: 'AI Counseling Card',
    width: 1280,
    height: 720,
  },
  'ai-parent-report': {
    label: 'AI Parent Report',
    width: 1280,
    height: 720,
  },
};
