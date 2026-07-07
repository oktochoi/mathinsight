import { generateWithGemini } from '@/lib/ai/gemini';
import { isGeminiConfigured, geminiConfigHint, getGeminiConfigStatus } from '@/lib/ai/env';
import { guardAiOutput } from '@/lib/ai/security';

export type StaffAgentChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type StaffAgentResult =
  | { ok: true; answer: string; source: 'gemini' | 'rules' }
  | { ok: false; error: string };

const SUGGESTED_QUESTIONS = [
  '신규 학생은 어떻게 등록하나요?',
  '수납 미납은 어디서 확인하나요?',
  '강사에게 반을 배정하려면?',
  '학부모에게 공지는 어떻게내나요?',
  '우리 학원 성장을 위해 뭘 먼저 하면 좋을까요?',
];

export function getSuggestedStaffQuestions(): string[] {
  return [...SUGGESTED_QUESTIONS];
}

const PRODUCT_GUIDE = `
EduFlow 주요 기능 안내:
• 대시보드(/dashboard): 오늘 수업·미납·재등록 등 운영 요약
• 학생(/students): 학생 등록·상세·출결·성적·메모
• 반(/classes): 반 생성·시간표·담당 강사 배정
• 수납(/billing): 청구·입금·미납·연체 관리
• 일정(/schedule): 주간 캘린더·보강·특강 예약
• 수업 기록(/lesson-logs): 수업 마감·숙제·점수 입력
• 커리큘럼(/curriculum): 과목·단원·반별 진도
• 공지(/notices): 학부모·학생 포털 공지
• 학부모 리포트(/parent-reports): AI 초안·전달
• 상담 카드(/consultation-cards): 상담 기록·학부모 전달
• 설정(/settings): 학원 정보·알림·구독·강사 반 배정

성장·운영 팁:
• 매주 수업 마감과 숙제·점수 입력을 꾸준히 하면 학부모 포털·AI 리포트 품질이 올라갑니다.
• 미납·재등록 알림을 대시보드에서 먼저 처리하면 이탈을 줄일 수 있습니다.
• 강사별 담당 반을 설정하면 강사 화면이 해당 반만 보여 혼선이 줄어듭니다.
• 학원 정보(수강료·FAQ)를 설정에 입력하면 학부모 AI 도우미 답변에 반영됩니다.
`.trim();

function answerWithRules(question: string): string {
  const q = question.trim();
  if (/등록|신규|학생 추가/.test(q)) {
    return '학생 메뉴(/students)에서 학생을 추가할 수 있습니다. 가입 코드로 학부모·학생이 직접 연결할 수도 있습니다. 반 배정은 학생 상세 또는 반 관리에서 진행하세요.';
  }
  if (/수납|미납|연체|청구/.test(q)) {
    return '수납 운영 센터(/billing)에서 미납·연체·오늘 납부 예정을 한눈에 볼 수 있습니다. 대시보드 수납 스냅샷에서도 바로가기를 제공합니다.';
  }
  if (/강사|반 배정|담당/.test(q)) {
    return '설정(/settings)에서 반별 담당 강사를 지정할 수 있습니다. 배정 후 강사 계정에는 담당 반 학생·일정만 표시됩니다.';
  }
  if (/공지|알림/.test(q)) {
    return '공지(/notices)에서 학부모·학생 포털에 올릴 내용을 작성하세요. 푸시 알림은 공지·숙제·수납 등 이벤트에 연동됩니다.';
  }
  if (/성장|전략|먼저|개선/.test(q)) {
    return '우선순위 제안: ① 매주 수업 기록·숙제 입력 습관화 ② 미납·재등록 대시보드 점검 ③ 학부모 리포트·상담 카드로 소통 ④ 커리큘럼 진도로 학부모 신뢰 확보. 데이터가 쌓일수록 AI·리포트 효과가 커집니다.';
  }
  if (/커리큘럼|진도|단원/.test(q)) {
    return '커리큘럼(/curriculum)에서 과목·단원을 등록하고 반별 진도를 관리합니다. 수업 마감 후속에서 다음 단원 이동을 안내합니다.';
  }
  return `질문을 이해했습니다. EduFlow에서는 메뉴별로 기능이 나뉘어 있으니, 구체적인 화면 이름을 알려주시면 더 정확히 안내할 수 있습니다.\n\n${PRODUCT_GUIDE.slice(0, 400)}…`;
}

const STAFF_AGENT_SYSTEM = `당신은 EduFlow 학원 운영 프로그램의 원장·강사용 안내 어시스턴트입니다.

원칙:
- 제공된 제품 기능 설명만 근거로 답합니다. 없는 기능을 지어내지 않습니다.
- 학원 성장·운영 조언은 일반적인 학원 운영 베스트 프랙티스 수준으로, 단정적 진단은 피합니다.
- 따뜻하고 실용적인 한국어. 6~12문장 또는 "• " 불릿 3~5개.
- 마크다운·HTML 금지. 평문만.

출력: 순수 한국어 평문.`;

export async function runStaffAgent(
  question: string,
  history: StaffAgentChatMessage[] = []
): Promise<StaffAgentResult> {
  const q = question.trim();
  if (!q) return { ok: false, error: '질문을 입력해 주세요.' };

  if (!isGeminiConfigured()) {
    return {
      ok: true,
      answer: answerWithRules(q),
      source: 'rules',
    };
  }

  const historyBlock =
    history.length > 0
      ? history.map((m) => `${m.role === 'user' ? '사용자' : '안내'}: ${m.content}`).join('\n')
      : '(없음)';

  const userPrompt = `[제품 기능 안내]
${PRODUCT_GUIDE}

[이전 대화]
${historyBlock}

[질문]
${q}

위 안내만 근거로 EduFlow 사용법·운영 팁을 답하세요.`;

  try {
    const { text } = await generateWithGemini(userPrompt, {
      systemInstruction: STAFF_AGENT_SYSTEM,
      temperature: 0.35,
      maxOutputTokens: 2048,
    });
    const answer = guardAiOutput(text.trim());
    if (!answer) throw new Error('빈 응답');
    return { ok: true, answer, source: 'gemini' };
  } catch {
    return { ok: true, answer: answerWithRules(q), source: 'rules' };
  }
}
