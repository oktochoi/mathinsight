/** EduFlow 마케팅 사이트 IA — 단일 출처 */

export const MARKETING_ROUTES = {
  home: '/',
  product: '/product',
  workflow: '/workflow',
  ai: '/ai',
  demo: '/demo',
  pricing: '/pricing',
  customers: '/customers',
  resources: '/resources',
  security: '/security',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  signup: '/signup',
  auth: '/login',
} as const;

export const HEADER_NAV = [
  { href: MARKETING_ROUTES.product, label: 'Product' },
  { href: MARKETING_ROUTES.pricing, label: 'Pricing' },
  { href: MARKETING_ROUTES.auth, label: '로그인' },
] as const;

export const PRODUCT_PROBLEMS = [
  {
    title: '상담 준비에 시간이 오래 걸립니다',
    desc: '출결·숙제·성적·메모가 여러 곳에 흩어져 있어, 상담 전마다 자료를 다시 모읍니다.',
  },
  {
    title: '학생 기록이 흩어져 있습니다',
    desc: '수업·상담·학부모 소통이 연결되지 않아 학생을 한눈에 이해하기 어렵습니다.',
  },
  {
    title: '학부모 소통이 번거롭습니다',
    desc: '상담 내용을 정리해 전달하는 과정이 반복 업무가 되고, 맥락이 끊깁니다.',
  },
] as const;

export const PRODUCT_WORKFLOW_STEPS = [
  { title: '시간표' },
  { title: '오늘 수업' },
  { title: '출결' },
  { title: '숙제' },
  { title: '점수' },
  { title: '수업 종료' },
  { title: 'AI 요약' },
  { title: '학부모 전달' },
  { title: '재등록' },
] as const;

/** Product — AI·RAG 엔진 (Workflow 아래) */
export const PRODUCT_AI_CAPABILITIES = [
  {
    id: 'student-rag',
    title: 'Student RAG',
    desc: '출결·숙제·상담 기록을 인덱싱해 맥락 있는 검색.',
    icon: 'ri-database-2-line',
    tag: 'RAG',
  },
  {
    id: 'parent-agent',
    title: 'Parent Agent',
    desc: '학부모 포털 AI — 우리 학원 데이터만 근거로 응답.',
    icon: 'ri-parent-line',
    tag: 'Agent',
  },
  {
    id: 'briefing',
    title: '상담 브리핑',
    desc: '상담 전 30초 학생 요약·talking points.',
    icon: 'ri-clipboard-line',
    tag: 'AI',
  },
  {
    id: 'risk-scan',
    title: 'Risk Snapshot',
    desc: '이탈·미납·성적 하락 신호를 큐로 모음.',
    icon: 'ri-alarm-warning-line',
    tag: 'Proactive',
  },
  {
    id: 'care-workflow',
    title: 'Care Workflow',
    desc: '위험 학생별 자동 케어 워크플로.',
    icon: 'ri-git-branch-line',
    tag: 'Automation',
  },
  {
    id: 'report-draft',
    title: '리포트 초안',
    desc: '상담 결과 → 학부모용 문장 변환.',
    icon: 'ri-file-text-line',
    tag: 'AI',
  },
] as const;

export const PRODUCT_KEY_FEATURES = PRODUCT_AI_CAPABILITIES;

export const PRODUCT_AI_POINTS = [
  {
    title: '상담 준비 브리핑',
    desc: '수업 기록을 바탕으로 상담 전 30초 요약을 제공합니다. AI가 주인공이 아니라, 원장의 판단을 돕습니다.',
  },
  {
    title: '학생 인사이트',
    desc: '출결·숙제·성적 변화를 읽고, 상담 시 말할 포인트를 제안합니다.',
  },
  {
    title: '학부모 리포트 초안',
    desc: '상담 결과를 학부모가 이해하기 쉬운 문장으로 정리합니다.',
  },
] as const;

export const PRODUCT_IMPACT_METRICS = [
  { label: '상담 준비 시간', value: '감소', sub: '기록 기반 브리핑' },
  { label: '학생 이해도', value: '향상', sub: '통합 타임라인' },
  { label: '학부모 소통', value: '개선', sub: '리포트·앱 연동' },
  { label: '재등록 관리', value: '효율 증가', sub: '상담과 연결' },
] as const;

export const PRICING_VALUE_PROPS = [
  {
    title: '기록이 쌓이면 상담이 준비됩니다',
    desc: '수업 입력만 해도 상담·학부모 전달·재등록 판단의 기반이 됩니다.',
  },
  {
    title: 'ERP를 대체하지 않고, 운영을 완성합니다',
    desc: 'ClassUp 등과 병행하거나, 상담·재등록 레이어로 사용할 수 있습니다.',
  },
  {
    title: '작은 학원부터 시작할 수 있습니다',
    desc: '스타터 플랜은 학생 50명 기준. 3일 무료 체험으로 먼저 확인하세요.',
  },
] as const;

export const PRICING_AUDIENCE = [
  { label: '소형 학원', desc: '상담 준비 자동화를 시작하는 원장' },
  { label: '성장 학원', desc: '상담·재등록 운영을 체계화하는 팀' },
  { label: '다지점', desc: '맞춤 Workflow·전담 온보딩이 필요한 조직' },
] as const;

export const DEMO_TOUR_SECTIONS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    desc: '오늘 상담·위험 학생·미마감 수업을 큐로 받습니다.',
    cta: 'Dashboard 체험',
  },
  {
    id: 'today-workspace',
    title: 'Today Workspace',
    desc: '출결·숙제·점수·메모를 한 화면에서 입력합니다.',
    cta: '수업 입력',
  },
  {
    id: 'student-detail',
    title: 'Student Detail',
    desc: '타임라인·AI 브리핑·상담·재등록을 한곳에서.',
    cta: '학생 상세',
  },
  {
    id: 'parent-app',
    title: 'Parent App',
    desc: '리포트·AI 도우미·일정 — 모바일 포털.',
    cta: '학부모 화면',
  },
  {
    id: 'billing',
    title: 'Billing',
    desc: '미납·연체·재등록 필터와 수납 테이블.',
    cta: '수납 화면',
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: `${MARKETING_ROUTES.product}#workflow`, label: 'Workflow' },
      { href: `${MARKETING_ROUTES.product}#ai`, label: 'Features' },
      { href: `${MARKETING_ROUTES.product}#ai`, label: 'AI Assistant' },
      { href: MARKETING_ROUTES.demo, label: 'Demo' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: MARKETING_ROUTES.about, label: 'About' },
      { href: MARKETING_ROUTES.customers, label: 'Customers' },
      { href: MARKETING_ROUTES.contact, label: 'Contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: MARKETING_ROUTES.faq, label: 'FAQ' },
      { href: MARKETING_ROUTES.security, label: 'Security' },
      { href: MARKETING_ROUTES.pricing, label: 'Pricing' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: MARKETING_ROUTES.privacy, label: '개인정보처리방침' },
      { href: MARKETING_ROUTES.terms, label: '이용약관' },
    ],
  },
] as const;

export const HOME_PROBLEMS = [
  {
    title: '상담 준비에 시간이 너무 오래 걸립니다',
    desc: '시험·숙제·메모를 매번 다시 찾아 정리합니다. 상담 전 30분이 반복 업무가 됩니다.',
  },
  {
    title: '관리 필요 사항을 놓칩니다',
    desc: '점수 하락·숙제 미제출·출결 변화가 흩어져 있어, 개입 타이밍을 놓칩니다.',
  },
  {
    title: '재등록 타이밍을 놓칩니다',
    desc: '상담 기록과 재등록 판단이 연결되지 않아, 이탈 전에 대화하기 어렵습니다.',
  },
] as const;

export const HOME_AI_PREVIEWS = [
  {
    id: 'summary',
    title: '학생 요약',
    desc: '상담 전 학생의 최근 변화와 말해야 할 포인트를 한 페이지로 정리합니다.',
    href: MARKETING_ROUTES.ai,
  },
  {
    id: 'risk',
    title: '학생 현황',
    desc: '성적·숙제·출결 패턴에서 관리가 필요한 사항을 근거와 함께 보여줍니다.',
    href: `${MARKETING_ROUTES.ai}#risk`,
  },
  {
    id: 'card',
    title: '상담 요약',
    desc: '학부모·학생별 대화 포인트와 후속 과제 초안을 준비합니다.',
    href: `${MARKETING_ROUTES.ai}#counseling-card`,
  },
] as const;

export const HOME_EXPLORE = [
  {
    href: MARKETING_ROUTES.workflow,
    label: 'Workflow',
    desc: '기록이 상담으로, 상담이 재등록으로 이어지는 흐름',
  },
  {
    href: MARKETING_ROUTES.demo,
    label: 'Demo',
    desc: '로그인 없이 핵심 화면 체험',
  },
  {
    href: MARKETING_ROUTES.pricing,
    label: 'Pricing',
    desc: '학원 규모별 플랜 비교',
  },
] as const;

export const HOME_TRUST_SIGNALS = [
  { value: 9, suffix: '단계', label: '기록 → 상담 → 재등록 운영 흐름' },
  { value: 3, suffix: '일', label: '무료 체험 (카드 없음)' },
  { value: 3, suffix: '초', label: '오늘 운영 파악 목표' },
] as const;

export const PRODUCT_SCENES = [
  {
    id: 'dashboard',
    title: '운영 Dashboard',
    scene: '오늘 수업, 출결·숙제 미완료, 학부모 문의 — 출근 후 바로 파악합니다.',
    detail: '원장이 매일 여는 첫 화면. 상담은 운영 흐름 안에서 자연스럽게 이어집니다.',
  },
  {
    id: 'student-hub',
    title: 'Student Hub',
    scene: '학생 한 명의 수업·출결·숙제·성적·상담을 순서대로 봅니다.',
    detail: '학생이 먼저, AI 요약은 보조. 상담 전 맥락을 한곳에서 확인합니다.',
  },
  {
    id: 'today-lesson',
    title: 'Today Lesson',
    scene: '오늘 수업에서 출결, 숙제, 점수, 메모를 1분 안에 기록합니다.',
    detail: 'Lesson 단위 마감으로 기록 누락을 줄이고, AI 분석의 입력을 만듭니다.',
  },
  {
    id: 'counseling',
    title: 'Counseling',
    scene: '수업 기록을 바탕으로 상담 준비 메모를 검토하고 상담을 진행합니다.',
    detail: '근거 기록(시험·숙제·메모)과 함께 상담 요약을 수정·완료합니다.',
  },
  {
    id: 'parent-report',
    title: 'Parent Report',
    scene: '상담 결과를 학부모가 이해하기 쉬운 리포트로 전달합니다.',
    detail: '포털 AI가 같은 맥락으로 24시간 질의에 답할 수 있습니다.',
  },
  {
    id: 'reregistration',
    title: 'Re-registration',
    scene: '재등록 위험도·상담 이력·전환 기록을 한 흐름으로 추적합니다.',
    detail: '이탈 전에 대화할 학생과 근거를 큐로 받습니다.',
  },
  {
    id: 'teacher',
    title: 'Teacher Dashboard',
    scene: '강사는 오늘 수업·마감·담당 학생만 보면 됩니다.',
    detail: '기록 부담을 줄이고, 상담에 필요한 데이터를 자연스럽게 쌓습니다.',
  },
] as const;

export const WORKFLOW_STEPS = [
  { title: '오늘 수업', desc: 'Lesson 단위로 수업을 시작합니다.' },
  { title: '출결·숙제·점수·메모', desc: '1분 안에 기록하고 마감합니다.' },
  { title: '학생 변화 기록', desc: '타임라인에 변화가 쌓입니다.' },
  { title: '학생 분석', desc: '패턴을 읽고 상담 준비 메모를 추출합니다.' },
  { title: '관리 필요 학생', desc: '이탈 신호에 우선순위를 부여합니다.' },
  { title: '상담 준비', desc: '오늘 상담 큐와 준비 상태를 확인합니다.' },
  { title: '상담 요약', desc: '학부모·학생별 대화 포인트 초안.' },
  { title: '학부모 상담·리포트', desc: '상담 후 리포트와 포털 AI 맥락.' },
  { title: '재등록 관리', desc: '위험도·상담·전환을 연결해 추적합니다.' },
] as const;

export const AI_FEATURES = [
  {
    id: 'summary',
    title: '학생 요약',
    outcome: '상담 전에 학생의 최근 변화, 관리 필요 사항, 말해야 할 포인트를 정리합니다.',
    example: '「3주간 80→68, 숙제 미제출 2회 — 루틴·오답노트부터」',
  },
  {
    id: 'risk',
    title: '학생 현황',
    outcome: '놓치기 쉬운 이탈 신호를 점수·근거와 함께 보여줍니다.',
    example: '관리 필요 · 숙제·성적 복합 · 개입 권장',
  },
  {
    id: 'counseling-card',
    title: '상담 요약',
    outcome: '학부모·학생별 대화 포인트와 후속 과제 초안을 준비합니다.',
    example: '학부모: 루틴 공유 / 학생: 오답노트 1주 챌린지',
  },
  {
    id: 'parent-report',
    title: '학부모 요약',
    outcome: '상담·학습 변화를 학부모가 읽기 쉬운 리포트로 만듭니다.',
    example: '주간 변화 · 다음 주 포커스 · 포털 문의 응답',
  },
  {
    id: 'retention',
    title: '재등록 추천',
    outcome: '재등록 타이밍과 근거를 상담 기록과 연결해 보여줍니다.',
    example: '재등록 관리 필요 · 전월 대비 ↓12% · 상담 D-7',
  },
] as const;

export const PRICING_PLANS = [
  {
    name: '스타터',
    planId: 'starter',
    students: '50명',
    price: 39000,
    priceLabel: '39,000',
    desc: '상담 준비 자동화를 시작하는 소형 학원',
    features: [
      '학생 50명',
      'AI 상담 브리핑',
      '학부모 리포트 (기본)',
      '오늘 상담 큐',
      '출결·숙제·성적 기록',
    ],
    featured: false,
    badge: null,
  },
  {
    name: '성장',
    planId: 'growth',
    students: '150명',
    price: 79000,
    priceLabel: '79,000',
    desc: '상담·재등록 운영을 체계화하는 학원',
    features: [
      '학생 150명',
      'Workflow 전체',
      'AI 학생 현황 · 위험 관리',
      '학부모 포털 · 채팅',
      '재등록 관리 · 강사 Dashboard',
      '우선 지원',
    ],
    featured: true,
    badge: '추천',
  },
  {
    name: '프로',
    planId: 'pro',
    students: '무제한',
    price: 149000,
    priceLabel: '149,000',
    desc: '다지점 · 맞춤 AI · 전담 온보딩',
    features: [
      '학생 무제한',
      '성장 플랜 전체',
      '다학원 관리',
      '전담 CS · 온보딩',
      '맞춤 Workflow · API',
      '보안 감사 지원',
    ],
    featured: false,
    badge: null,
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: '기존 엑셀 데이터를 가져올 수 있나요?',
    a: '학생·수업 기록은 단계적 이전을 지원합니다. 도입 상담 시 현재 운영 방식에 맞는 온보딩을 안내드립니다.',
  },
  {
    q: 'ClassUp 같은 ERP와 함께 사용할 수 있나요?',
    a: 'EduFlow는 상담·재등록 운영에 특화되어 있습니다. ERP와 병행해 상담 Workflow 레이어로 사용하는 학원도 있습니다.',
  },
  {
    q: 'AI가 어떤 데이터를 사용하나요?',
    a: '학원이 기록한 수업·출결·숙제·시험·상담 메모만 사용합니다. 학원별 데이터는 분리되며, AI 학습용 외부 공유는 하지 않습니다.',
  },
  {
    q: '학생 개인정보는 안전한가요?',
    a: '학원별 데이터 분리, 역할 기반 권한, 암호화 저장을 적용합니다. Security 페이지에서 상세 원칙을 확인할 수 있습니다.',
  },
  {
    q: '강사별 권한 설정이 가능한가요?',
    a: '원장·강사·상담 담당 등 역할별로 접근 범위를 설정할 수 있습니다.',
  },
  {
    q: '무료 체험은 어떻게 하나요?',
    a: '현재 행사 기간으로 모든 플랜을 무료로 이용하실 수 있습니다. 카드 등록 없이 /signup에서 바로 시작하거나, /demo에서 화면을 먼저 확인하세요.',
  },
  {
    q: '작은 학원도 사용할 수 있나요?',
    a: 'Starter 플랜은 학생 50명 기준으로 소형 학원에 맞춰 설계되어 있습니다.',
  },
] as const;

export const SECURITY_TOPICS = [
  {
    title: '개인정보 보호',
    desc: '학생·학부모 정보는 학원 운영 목적 범위 내에서만 처리합니다.',
  },
  {
    title: '권한 관리',
    desc: '원장·강사·상담 담당별로 화면과 데이터 접근을 제한합니다.',
  },
  {
    title: '학원별 데이터 분리',
    desc: '학원(tenant) 단위로 데이터가 논리적으로 분리됩니다.',
  },
  {
    title: 'AI 데이터 사용 원칙',
    desc: 'AI는 해당 학원 기록만 참조합니다. 타 학원·외부 학습에 사용하지 않습니다.',
  },
  {
    title: '데이터 백업',
    desc: '정기 백업과 복구 절차를 운영합니다.',
  },
  {
    title: '접근 권한 관리',
    desc: '인증·세션·감사 로그로 접근을 추적합니다.',
  },
] as const;

export const RESOURCES_ITEMS = [
  {
    title: '학원 상담 운영 가이드',
    desc: '상담 전·중·후 체크리스트와 기록 습관.',
    tag: 'Guide',
  },
  {
    title: '재등록 관리 팁',
    desc: '이탈 신호를 상담 타이밍으로 연결하는 방법.',
    tag: 'Guide',
  },
  {
    title: 'AI 상담 활용법',
    desc: 'AI 카드·리포트를 실제 상담에 적용하는 베스트 프랙티스.',
    tag: 'AI',
  },
  {
    title: '업데이트 노트',
    desc: 'Lesson ERP 연동, Risk Snapshot, 상담 큐 등 최근 변경.',
    tag: 'Update',
  },
] as const;

export const CUSTOMER_PILOT = {
  status: '파일럿 준비 중',
  note: '원장 인터뷰 기반으로 상담 Workflow를 개선하고 있습니다. 과장된 수치 대신 실제 피드백을 반영합니다.',
  quotes: [
    {
      role: '원장 (인터뷰)',
      text: '상담 전에 학생 파일 여러 군데 뒤지는 시간이 가장 부담이에요.',
    },
    {
      role: '원장 (인터뷰)',
      text: '재등록 시즌에 누구부터 연락해야 할지 근거가 없어요.',
    },
  ],
  beforeAfter: [
    { before: '상담 전 30분 자료 정리', after: 'AI Summary로 5분 검토' },
    { before: '위험 학생을 감으로 판단', after: 'Risk Snapshot 큐로 우선순위' },
    { before: '재등록과 상담 기록 분리', after: '상담→재등록 한 흐름' },
  ],
} as const;

export const DEMO_SECTIONS = DEMO_TOUR_SECTIONS;

/** Carefor 스타일 Home 전용 */
export const CF_QUICK_LINKS = [
  { href: MARKETING_ROUTES.resources, icon: 'ri-guide-line', label: '처음\n사용안내' },
  { href: MARKETING_ROUTES.demo, icon: 'ri-play-circle-line', label: '체험\n하기' },
  { href: MARKETING_ROUTES.pricing, icon: 'ri-price-tag-3-line', label: '이용\n요금' },
  { href: MARKETING_ROUTES.faq, icon: 'ri-question-answer-line', label: '자주\n묻는질문' },
  { href: MARKETING_ROUTES.contact, icon: 'ri-mail-send-line', label: '도입\n문의' },
  { href: MARKETING_ROUTES.workflow, icon: 'ri-git-branch-line', label: 'Workflow\n안내' },
  { href: MARKETING_ROUTES.auth, icon: 'ri-login-box-line', label: '데모\n로그인' },
] as const;

export const CF_HERO_SLIDES = [
  {
    id: 'main',
    tag: 'AI Counseling OS',
    title: '원장이 매일 쓰는 학원 운영 시스템',
    desc: '오늘 수업·출결·숙제부터 상담 준비, 학부모 리포트, 재등록 관리까지 하나의 흐름으로.',
    cta: { href: MARKETING_ROUTES.signup, label: '무료 체험하기' },
    tone: 'peach',
  },
  {
    id: 'workflow',
    tag: '핵심 차별점',
    title: '기록 → 상담 → 재등록',
    desc: '학원 ERP가 아닌, 상담과 재등록을 지키는 AI 상담 운영 시스템입니다.',
    cta: { href: MARKETING_ROUTES.workflow, label: 'Workflow 보기' },
    tone: 'sky',
  },
  {
    id: 'demo',
    tag: 'Demo Academy',
    title: '로그인 없이 핵심 화면 체험',
    desc: 'Dashboard, AI 상담 카드, Parent Report를 샘플 데이터로 확인하세요.',
    cta: { href: MARKETING_ROUTES.demo, label: '데모 체험' },
    tone: 'mint',
  },
] as const;

export const CF_NOTICES = [
  { tag: 'NEW', title: 'Lesson 마감·출결 ERP 연동 기능 오픈', date: '2026.05.20' },
  { tag: '공지', title: '학부모 AI 포털 24시간 문의 서비스 정식 운영', date: '2026.05.12' },
  { tag: '안내', title: '재등록 상담 큐 · Risk Snapshot 업데이트', date: '2026.05.01' },
  { tag: '이벤트', title: '신규 학원 14일 무료 체험 프로그램', date: '2026.04.28' },
] as const;

export const CF_RESOURCES = [
  { tag: '가이드', title: 'EduFlow 도입 7일 온보딩 체크리스트', date: '2026.05.18' },
  { tag: '자료', title: '상담·재등록 운영 매뉴얼', date: '2026.05.10' },
  { tag: '영상', title: '원장·강사·학부모 역할별 사용법', date: '2026.04.22' },
  { tag: 'FAQ', title: 'ClassUp·엑셀 데이터 이전 FAQ', date: '2026.04.15' },
] as const;

export const CF_SERVICES = [
  {
    title: '수업·기록',
    desc: 'Lesson 단위 출결·숙제·점수·메모를 1분 안에 기록하고 AI 분석의 입력을 만듭니다.',
    primary: { href: MARKETING_ROUTES.product + '#today-lesson', label: '사용안내' },
    secondary: { href: MARKETING_ROUTES.demo, label: '체험하기' },
  },
  {
    title: '학생 분석·상담 준비',
    desc: '학생 요약, 학생 현황, 상담 요약으로 상담 전 준비 시간을 줄입니다.',
    primary: { href: MARKETING_ROUTES.ai, label: 'AI 기능' },
    secondary: { href: MARKETING_ROUTES.demo, label: '체험하기' },
  },
  {
    title: '상담·재등록',
    desc: '위험 학생 큐, 상담 이력, 재등록 위험도를 한 Workflow로 연결합니다.',
    primary: { href: MARKETING_ROUTES.workflow, label: 'Workflow' },
    secondary: { href: MARKETING_ROUTES.product + '#reregistration', label: '자세히' },
  },
  {
    title: '학부모 리포트',
    desc: '상담 결과를 리포트로 전달하고, 포털 AI가 24시간 같은 맥락으로 답합니다.',
    primary: { href: MARKETING_ROUTES.product + '#parent-report', label: '사용안내' },
    secondary: { href: MARKETING_ROUTES.demo, label: '체험하기' },
  },
  {
    title: '원장 Dashboard',
    desc: '오늘 해야 할 일, 시간표, 출결·숙제 — 출근 후 바로 운영을 시작합니다.',
    primary: { href: MARKETING_ROUTES.product + '#dashboard', label: '화면 보기' },
    secondary: { href: MARKETING_ROUTES.auth, label: '로그인' },
  },
] as const;
