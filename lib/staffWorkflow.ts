import type { StaffPageKey } from '@/lib/staffPages';

/** 매일 이 순서만 기억하면 됩니다 */
export const STAFF_DAILY_FLOW = [
  {
    step: 1,
    title: '출결·숙제',
    desc: '수업 후 출결·숙제 전용 화면에서 빠르게 체크',
    href: '/attendance',
    icon: 'ri-user-follow-line',
  },
  {
    step: 2,
    title: '오늘 할 일',
    desc: '상담·보강·미제출·결석 한눈에',
    href: '/dashboard',
    icon: 'ri-dashboard-line',
  },
  {
    step: 3,
    title: '상담',
    desc: '필요한 학생만 AI 상담 준비',
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
    role: '학생 등록·수정. 학습 신호는 기록을 바탕으로 자동 표시됩니다.',
    primaryLabel: '학생 등록',
    primaryHref: '/students',
    tasks: ['학생 등록·일괄 등록', '학습 신호 「양호」면 대시보드에 안 뜸'],
  },
  classes: {
    role: '반을 만들고 학생·담당 강사를 지정합니다.',
    primaryLabel: '반 추가',
    primaryHref: '/classes',
    tasks: ['반 추가·수정', '학생 배정', '담당 강사 지정'],
  },
  attendance: {
    role: '출결 전용 화면. 결석 학생은 보강 검토 대상으로 표시됩니다.',
    primaryLabel: '오늘 출결 체크',
    primaryHref: '/attendance',
    tasks: ['날짜·반 선택', '출석/지각/결석 저장', '결석 필터로 보강 대상 확인'],
  },
  homework: {
    role: '숙제 제출 현황·과제 등록. 상담·Risk Agent와 연동됩니다.',
    primaryLabel: '미제출 확인',
    primaryHref: '/homework?filter=missing',
    tasks: ['일일 제출 상태 저장', '숙제 과제 등록', '피드백 메모 작성'],
  },
  grades: {
    role: '시험·점수 관리. 점수 하락 학생은 상담 검토로 연결됩니다.',
    primaryLabel: '시험 등록',
    primaryHref: '/grades',
    tasks: ['시험 만들기', '점수 입력·반 평균', '하락 추세 학생 확인'],
  },
  counseling: {
    role: 'EduFlow 핵심 화면. 상담 예약부터 완료·후속조치까지 관리합니다.',
    primaryLabel: '상담 예약',
    primaryHref: '/counseling',
    tasks: ['예약 → 시작 → 완료', 'AI 상담 카드·학생 상세 연동', '학부모 메시지 초안'],
  },
  notices: {
    role: '학원 공지를 작성·발행합니다. 학부모·학생 포털에 표시됩니다.',
    primaryLabel: '공지 작성',
    primaryHref: '/notices',
    tasks: ['대상 선택(전체/반/학생)', '임시 저장 또는 발행'],
  },
  messages: {
    role: '학부모 문의함. AI 초안으로 빠르게 답변하세요.',
    primaryLabel: '대기 문의',
    primaryHref: '/messages',
    tasks: ['문의 선택', 'AI 답변 초안', '답변 완료 저장'],
  },
  curriculum: {
    role: '수학 단원·반별 진도. 상담 카드·리포트에 활용됩니다.',
    primaryLabel: '진도 설정',
    primaryHref: '/curriculum',
    tasks: ['학년별 기본 단원 등록', '반별 현재 단원 저장'],
  },
  billing: {
    role: '수강료 청구·완납·연체 관리. 재등록 예측과 연동됩니다.',
    primaryLabel: '청구 등록',
    primaryHref: '/billing',
    tasks: ['학생별 청구', '완납 처리', '미납 알림 발송'],
  },
  notifications: {
    role: '문자·카카오 알림 발송. 연동 전에는 데모 로그만 저장됩니다.',
    primaryLabel: '메시지 발송',
    primaryHref: '/notifications',
    tasks: ['템플릿 선택', '수신자·내용 입력', '발송 기록 확인'],
  },
  integrations: {
    role: 'Google Calendar ICS·SMS/카카오 설정. 처음 한 번만 설정하면 됩니다.',
    primaryLabel: 'ICS URL 복사',
    primaryHref: '/integrations',
    tasks: ['캘린더 구독 URL', 'SMS/카카오 활성화 플래그'],
  },
  retention: {
    role: '재등록·학습 신호 — 경영 리포트에 통합되었습니다.',
    primaryLabel: '경영 리포트',
    primaryHref: '/analytics#attention',
    tasks: ['학습 신호 갱신', '재등록 예정 상담', '이탈 학생 연락'],
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
    role: '이번 달 학원 성장·운영·수납을 보고 다음 행동을 결정합니다. 오늘 운영은 대시보드에서.',
    primaryLabel: 'Action Center 확인',
    primaryHref: '/analytics',
    tasks: ['월간 요약', '운영 Action 처리', 'AI 인사이트'],
  },
  settings: {
    role: '처음 한 번: 학원·반·시간표·연결 코드. 이후 가끔만 엽니다.',
    primaryLabel: '연결 코드 확인',
    primaryHref: '/settings',
    tasks: ['반·시간표 등록', '학부모 연결 요청 승인'],
  },
};
