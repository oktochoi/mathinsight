/** 원장·강사 화면 — 제목·설명·할 일 (한국어) */

export type StaffPageKey =
  | 'dashboard'
  | 'schedule'
  | 'students'
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
    title: '대시보드',
    description: '① 수업 기록 후, 조치가 필요한 학생만 확인하는 곳입니다.',
    tasks: ['오늘 수업·조치 필요 학생', '필요 시 학생 상세·상담'],
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
    title: '학생 관리',
    description: '학생·반 등록. 학습 신호는 기록이 쌓이면 자동으로 붙습니다.',
    tasks: ['학생 등록·이메일 연결', '「양호」는 대시보드에 안 나옴'],
    href: '/students',
    icon: 'ri-group-line',
  },
  'lesson-logs': {
    title: '수업 기록',
    description: '출석·숙제·점수·메모를 한 번에 저장합니다.',
    tasks: ['반·날짜·단원 선택', '학생별 출석·숙제·점수 입력', '저장 후 학습 신호에 반영'],
    href: '/lesson-logs',
    icon: 'ri-book-open-line',
  },
  'consultation-cards': {
    title: '상담 카드',
    description: '수업 기록을 바탕으로 상담 요약·학부모 메시지를 만듭니다.',
    tasks: [
      '학생·기간 선택 후 초안 생성',
      '저장 = 상담 대기, 상담 후 「완료 처리」',
      '완료된 상담만 「지난 상담 이후」 분석에 반영',
    ],
    href: '/consultation-cards',
    icon: 'ri-chat-check-line',
  },
  'parent-reports': {
    title: '학부모 리포트',
    description: '기간별 학습 안내 문서를 작성·저장합니다. (학부모 앱 Agent와 별도)',
    tasks: ['학생·기간 선택', '리포트 생성·수정', '저장 — 학부모 포털에서 열람'],
    href: '/parent-reports',
    icon: 'ri-file-chart-line',
  },
  analytics: {
    title: '분석',
    description: '학원 전체 통계 (추가 기능 예정). 지금은 대시보드 차트를 참고하세요.',
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

/** 학생 목록 「학습 신호」 설명 */
export const STUDENT_SIGNAL_LEGEND = [
  { label: '양호', desc: '최근 기록상 특별한 이슈 없음 (대시보드 미표시)' },
  { label: '회복 중', desc: '점수·숙제가 나아지는 흐름 (대시보드 미표시)' },
  {
    label: '보강 권장',
    desc: '숙제 2회+ 미제출, 점수 8점+ 하락, 단원 정체 등 — 대시보드 표시',
  },
  {
    label: '상담 권장',
    desc: '숙제 3회+ 미제출, 점수 10점+ 하락 등 — 대시보드 표시',
  },
  { label: '주의 필요', desc: '가벼운 이슈만 있을 때 (목록만, 대시보드 제외)' },
] as const;

export const STUDENT_BADGE_LEGEND = [
  { label: '숙제 확인', desc: '최근 8회 중 미제출 2회 이상' },
  { label: '점수 변화', desc: '최근 시험 평균 8점 이상 하락' },
  { label: '확인 필요', desc: '같은 태그·메모가 2회 이상 반복' },
  { label: '상담 후 확인', desc: '상담 카드에서 남긴 확인 항목이 대기 중' },
] as const;
