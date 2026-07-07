import type { SupabaseClient } from '@supabase/supabase-js';
import { generateWithGemini } from '@/lib/ai/gemini';
import { isGeminiConfigured } from '@/lib/ai/env';
import { SYSTEM_INSTRUCTION } from '@/lib/ai/prompts';
import { retrieveStudentRagContext } from '@/lib/rag/retrieve';
import { assessStudentRisk } from '@/lib/studentRisk';
import { buildConsultationBriefing } from '@/lib/consultationBriefing';
import { logAgentRun } from '@/lib/agents/log';
import type {
  ConsultationCard,
  ConsultationFollowup,
  CounselingAgentResult,
  LessonLog,
  Student,
} from '@/types/database';

function parseBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

function rulesCounseling(
  student: Student,
  briefing: string[],
  riskLines: string[]
): CounselingAgentResult {
  return {
    summary: `${student.name} 학생 상담 준비 요약입니다. 최근 기록과 위험 신호를 기준으로 정리했습니다.`,
    mainIssues: riskLines.length ? riskLines : ['기록상 뚜렷한 위험 신호는 제한적입니다.'],
    consultationPoints: briefing.slice(0, 5),
    recommendedActions: [
      '최근 숙제·점수 추이를 학부모와 공유',
      '반복 태그·메모에 대한 학습 루틴 점검',
      '상담 후 follow-up 일정 확정',
    ],
    source: 'rules',
  };
}

export async function runCounselingAgent(
  supabase: SupabaseClient,
  academyId: string,
  studentId: string
): Promise<CounselingAgentResult & { ok: true } | { ok: false; error: string }> {
  await logAgentRun(supabase, {
    academyId,
    agentType: 'counseling',
    studentId,
    status: 'running',
    action: 'consultation_prep',
  });

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (!student) {
    await logAgentRun(supabase, {
      academyId,
      agentType: 'counseling',
      studentId,
      status: 'failed',
      action: 'consultation_prep',
      result: { error: 'student_not_found' },
    });
    return { ok: false, error: '학생을 찾을 수 없습니다.' };
  }

  const st = student as Student;
  const [logsRes, cardsRes, followRes, riskRes] = await Promise.all([
    supabase
      .from('lesson_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('lesson_date', { ascending: false })
      .limit(50),
    supabase
      .from('consultation_cards')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('consultation_followups').select('*').eq('student_id', studentId),
    supabase
      .from('student_risk_signals')
      .select('risk_level, reason, signals')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const logs = (logsRes.data ?? []) as LessonLog[];
  const cards = (cardsRes.data ?? []) as ConsultationCard[];
  const followups = (followRes.data ?? []) as ConsultationFollowup[];
  const lastCompleted = cards.find((c) => c.consultation_status === 'completed') ?? cards[0];
  const risk = assessStudentRisk(logs, { followups, lastCard: lastCompleted });
  const briefing = buildConsultationBriefing(st, logs, cards, followups);
  const briefingLines = briefing.lines;
  const riskLines = risk.signals.map((s) => s.label);
  if (riskRes.data?.reason) riskLines.unshift(riskRes.data.reason as string);

  const rag = await retrieveStudentRagContext(
    supabase,
    studentId,
    '상담 준비: 성적 숙제 상담 기록 위험 신호 종합'
  );

  if (!isGeminiConfigured() || !rag) {
    const result = rulesCounseling(st, briefingLines, riskLines);
    await logAgentRun(supabase, {
      academyId,
      agentType: 'counseling',
      studentId,
      status: 'completed',
      action: 'consultation_prep',
      result: { ...result, engine: 'rules' },
    });
    return { ok: true, ...result };
  }

  const prompt = `${rag.contextText}

[위험 신호]
${riskLines.join('\n')}

[기존 브리핑]
${briefingLines.join('\n')}

[요청]
위 데이터만 사용해 상담 준비 JSON을 작성하세요. 기록에 없는 내용은 추측하지 마세요.

{
  "summary": "상담 요약 4~6문장 — 학부모·강사가 읽기 쉽게, 근거를 드러내며",
  "mainIssues": ["기록 근거 주요 이슈 1~3개"],
  "consultationPoints": ["상담실에서 실제로 할 말 2~4개"],
  "recommendedActions": ["후속 조치 1~3개"]
}

JSON만 출력합니다. 마크다운 없음.`;

  try {
    const { text } = await generateWithGemini(prompt, {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.32,
      maxOutputTokens: 2048,
    });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed: CounselingAgentResult;
    if (jsonMatch) {
      const raw = JSON.parse(jsonMatch[0]) as CounselingAgentResult;
      parsed = {
        summary: raw.summary ?? '',
        mainIssues: raw.mainIssues ?? [],
        consultationPoints: raw.consultationPoints ?? [],
        recommendedActions: raw.recommendedActions ?? [],
        source: 'gemini',
      };
    } else {
      parsed = {
        summary: text.slice(0, 500),
        mainIssues: parseBullets(text),
        consultationPoints: briefingLines.slice(0, 4),
        recommendedActions: ['상담 후 기록 업데이트', '학부모 리포트 검토'],
        source: 'gemini',
      };
    }

    await logAgentRun(supabase, {
      academyId,
      agentType: 'counseling',
      studentId,
      status: 'completed',
      action: 'consultation_prep',
      result: { source: 'gemini', ragMeta: rag.meta },
    });
    return { ok: true, ...parsed };
  } catch (e) {
    const result = rulesCounseling(st, briefingLines, riskLines);
    await logAgentRun(supabase, {
      academyId,
      agentType: 'counseling',
      studentId,
      status: 'completed',
      action: 'consultation_prep',
      result: {
        source: 'rules',
        fallback: e instanceof Error ? e.message : 'gemini_error',
      },
    });
    return { ok: true, ...result };
  }
}
