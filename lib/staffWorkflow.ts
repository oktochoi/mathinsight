import type { StaffPageKey } from '@/lib/staffPages';

/** 매일 이 순서만 기억하면 됩니다 */
export const STAFF_DAILY_FLOW = [
  {
    step: 1,
    title: '수업 기록',
    desc: '수업이 끝나면 출석·숙제·점수 입력',
    href: '/lesson-logs',
    icon: 'ri-edit-line',
  },
  {
    step: 2,
    title: '대시보드',
    desc: '조치 필요 학생만 확인',
    href: '/dashboard',
    icon: 'ri-dashboard-line',
  },
  {
    step: 3,
    title: '상담·리포트',
    desc: '필요한 학생만 (선택)',
    href: '/consultation-cards',
    icon: 'ri-chat-check-line',
  },
] as const;

export type StaffPagePlaybook = {
  role: string;
  primaryLabel: string;
  primaryHref: string;
  tasks: string[];
};

export const STAFF_PAGE_PLAYBOOK: Record<StaffPageKey, StaffPagePlaybook> = {
  dashboard: {
    role: '오늘 할 일과 조치가 필요한 학생만 봅니다. 여기서 시작하세요.',
    primaryLabel: '수업 기록 입력',
    primaryHref: '/lesson-logs',
    tasks: ['오늘 수업·조치 필요 학생 확인', '이상 있으면 학생 상세 → 상담 카드'],
  },
  schedule: {
    role: '언제 수업이 있는지 봅니다. 기록 입력은 「수업 기록」 메뉴에서 합니다.',
    primaryLabel: '수업 기록으로 이동',
    primaryHref: '/lesson-logs',
    tasks: ['주간 일정 확인', '보강·휴강은 설정·시간표에서'],
  },
  students: {
    role: '학생 등록·연결. 학습 신호는 기록을 바탕으로 자동 표시됩니다.',
    primaryLabel: '학생 등록',
    primaryHref: '/students',
    tasks: ['학생·반 등록', '학습 신호 「양호」면 대시보드에 안 뜸'],
  },
  'lesson-logs': {
    role: '가장 자주 쓰는 화면입니다. 기록해야 대시보드·상담이 의미 있습니다.',
    primaryLabel: '오늘 날짜로 기록',
    primaryHref: '/lesson-logs',
    tasks: ['반·날짜 선택 → 출석·숙제·점수 저장', '저장 후 대시보드에서 확인'],
  },
  'consultation-cards': {
    role: '상담 전 요약·학부모 메시지 초안. 매일 할 필요는 없습니다.',
    primaryLabel: '상담 카드 만들기',
    primaryHref: '/consultation-cards',
    tasks: ['학생 선택 → 생성 → 저장(대기)', '상담 후 「완료 처리」'],
  },
  'parent-reports': {
    role: '학부모에게 보낼 기간 리포트. Agent(학부모 앱)와 별개입니다.',
    primaryLabel: '리포트 작성',
    primaryHref: '/parent-reports',
    tasks: ['필요할 때만 학생·기간 선택 후 저장'],
  },
  analytics: {
    role: '추가 통계 (준비 중). 지금은 대시보드만 보셔도 됩니다.',
    primaryLabel: '대시보드로',
    primaryHref: '/dashboard',
    tasks: ['전체 흐름은 대시보드에서 확인'],
  },
  settings: {
    role: '처음 한 번: 학원·반·시간표·연결 코드. 이후 가끔만 엽니다.',
    primaryLabel: '연결 코드 확인',
    primaryHref: '/settings',
    tasks: ['반·시간표 등록', '학부모 연결 요청 승인'],
  },
};
