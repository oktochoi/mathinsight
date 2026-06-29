/** 원장·강사 화면 — 제목·설명·할 일 (한국어) */

export type StaffPageKey =
  | 'dashboard'
  | 'schedule'
  | 'students'
  | 'attendance'
  | 'homework'
  | 'grades'
  | 'counseling'
  | 'notices'
  | 'messages'
  | 'curriculum'
  | 'billing'
  | 'notifications'
  | 'integrations'
  | 'retention'
  | 'lesson-logs'
  | 'consultation-cards'
  | 'parent-reports'
  | 'analytics'
  | 'settings';

export const STAFF_PAGES: Record<
  StaffPageKey,
  { title: string; description: string; tasks: string[]; href: string; icon: string }
> = {
  dashboard: {
    title: '오늘 현황',
    description: '오늘 해야 할 일·수업·상담·미납·재등록을 한 화면에서 확인합니다.',
    tasks: ['오늘 체크리스트', '시간표 확인', '미완료 출결·숙제'],
    href: '/dashboard',
    icon: 'ri-dashboard-line',
  },
  schedule: {
    title: '시간표',
    description: '반별 수업 일정·보강·휴강을 관리합니다.',
    tasks: ['주간 일정 확인', '수업 전 준비 화면으로 이동', '보강·휴강 등록'],
    href: '/schedule',
    icon: 'ri-calendar-line',
  },
  students: {
    title: '학생 목록',
    description: '학생 목록·반·학부모 연결을 관리합니다. 학생 상세에서 수업·출결·상담 기록을 확인합니다.',
    tasks: ['학생 등록·수정', '반 배정', '학부모 연결'],
    href: '/students',
    icon: 'ri-group-line',
  },
  attendance: {
    title: '출결',
    description: '반·날짜별 출결을 확인합니다. 일일 입력은 「오늘 수업」을 권장합니다.',
    tasks: ['반·날짜 선택', '출결 저장'],
    href: '/attendance',
    icon: 'ri-user-follow-line',
  },
  homework: {
    title: '숙제',
    description: '미제출·제출 현황을 확인합니다.',
    tasks: ['미제출 학생 확인', '제출 상태 저장'],
    href: '/homework',
    icon: 'ri-task-line',
  },
  grades: {
    title: '성적',
    description: '시험 점수와 추세를 확인합니다.',
    tasks: ['시험 점수 입력', '하락 학생 확인'],
    href: '/grades',
    icon: 'ri-medal-line',
  },
  counseling: {
    title: '상담',
    description: '상담 준비·진행·기록·학부모 전달을 한곳에서 처리합니다.',
    tasks: ['상담 시작', '상담 준비', '상담 완료·학부모 전달'],
    href: '/counseling',
    icon: 'ri-chat-smile-3-line',
  },
  notices: {
    title: '학부모 공지',
    description: '학부모·학생 포털에 발행하는 공지를 작성합니다.',
    tasks: ['공지 작성', '대상 선택', '발행'],
    href: '/notices',
    icon: 'ri-megaphone-line',
  },
  messages: {
    title: '학부모 문의함',
    description: '학부모 문의를 확인하고 AI 답변 초안으로 빠르게 답변합니다.',
    tasks: ['대기 문의 확인', 'AI 답변 초안', '답변 완료'],
    href: '/messages',
    icon: 'ri-mail-send-line',
  },
  curriculum: {
    title: '진도 관리',
    description: '수학 단원 등록과 반별 현재 진도를 관리합니다. 상담·수업 기록과 연결됩니다.',
    tasks: ['기본 단원 불러오기', '반별 진도 설정', '진도 요약 확인'],
    href: '/curriculum',
    icon: 'ri-road-map-line',
  },
  billing: {
    title: '수납 운영 센터',
    description: '이번 달 수납·미수금·연체·재등록을 한 화면에서 관리하고 바로 조치합니다.',
    tasks: ['청구 등록', '완납 처리', '미납·연체 확인'],
    href: '/billing',
    icon: 'ri-wallet-3-line',
  },
  notifications: {
    title: '문자·알림',
    description: 'SMS·카카오 알림톡 발송과 발송 기록을 관리합니다. (API 연동 전 데모 모드)',
    tasks: ['템플릿 선택', '메시지 발송', '발송 로그 확인'],
    href: '/notifications',
    icon: 'ri-notification-3-line',
  },
  integrations: {
    title: '연동 설정',
    description: 'Google Calendar ICS 구독, SMS·카카오 알림 연동 설정입니다.',
    tasks: ['ICS URL 복사', '캘린더 구독', 'SMS/카카오 활성화'],
    href: '/integrations',
    icon: 'ri-plug-line',
  },
  retention: {
    title: '학생 성장',
    description: '재등록 예정·학습 신호·성장 흐름을 한곳에서 확인합니다.',
    tasks: ['성장 요약 확인', '재등록 예정 상담', '학습 신호 갱신'],
    href: '/retention',
    icon: 'ri-line-chart-line',
  },
  'lesson-logs': {
    title: '오늘 수업',
    description: '출결·숙제·점수·메모를 한 번에 입력합니다. 모든 운영의 시작점입니다.',
    tasks: ['반·날짜 선택', '출결·숙제·점수 저장', '저장 후 Dashboard에서 확인'],
    href: '/lesson-logs',
    icon: 'ri-edit-box-line',
  },
  'consultation-cards': {
    title: '상담 기록',
    description: '수업 기록 기반 상담 요약·학부모 메시지 초안.',
    tasks: [
      '학생·기간 선택 후 초안 생성',
      '저장 = 상담 대기, 상담 후 「완료 처리」',
      '완료된 상담만 「지난 상담 이후」 분석에 반영',
    ],
    href: '/consultation-cards',
    icon: 'ri-chat-check-line',
  },
  'parent-reports': {
    title: '학부모 전달',
    description: '상담 후 학부모에게 보낼 기간별 안내 문서입니다.',
    tasks: ['학생·기간 선택', '리포트 생성·수정', '저장 — 학부모 포털에서 열람'],
    href: '/parent-reports',
    icon: 'ri-file-chart-line',
  },
  analytics: {
    title: '운영 분석',
    description: '출결·숙제·상담·재원생 추이를 한곳에서 확인합니다.',
    tasks: ['대시보드 요약 차트 확인'],
    href: '/analytics',
    icon: 'ri-bar-chart-2-line',
  },
  settings: {
    title: '설정',
    description: '학원 정보·반·시간표·연결 코드를 관리합니다.',
    tasks: ['학원명·연결 코드', '반·수업 시간 등록', '학부모 연결 요청 승인'],
    href: '/settings',
    icon: 'ri-settings-3-line',
  },
};

/** 학생 목록 「최근 학습 현황」 설명 */
export const STUDENT_SIGNAL_LEGEND = [
  { label: '양호', desc: '관리 필요 사항 없음' },
  { label: '회복 중', desc: '나아지는 흐름' },
  {
    label: '보강 권장',
    desc: '숙제·점수·정체 — 상담 검토 권장',
  },
  {
    label: '상담 권장',
    desc: '악화 추세 — 상담 후보',
  },
  { label: '주의 필요', desc: '가벼운 변화 — 목록 표시' },
] as const;

export const STUDENT_BADGE_LEGEND = [
  { label: '숙제 확인', desc: '최근 8회 중 미제출 2회 이상' },
  { label: '점수 변화', desc: '최근 시험 평균 8점 이상 하락' },
  { label: '확인 필요', desc: '같은 태그·메모가 2회 이상 반복' },
  { label: '상담 후 확인', desc: '상담 카드에서 남긴 확인 항목이 대기 중' },
] as const;
