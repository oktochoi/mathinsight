import type { SupabaseClient } from '@supabase/supabase-js';
import { generateWithGemini } from '@/lib/ai/gemini';
import { isGeminiConfigured } from '@/lib/ai/env';
import { retrieveStudentRagContext } from '@/lib/rag/retrieve';
import { generateParentReport } from '@/lib/reportGenerator';
import { logAgentRun } from '@/lib/agents/log';
import type { LessonLog, Student } from '@/types/database';

export type WeeklyReportDraft = {
  periodStart: string;
  periodEnd: string;
  reportText: string;
  source: 'gemini' | 'rules';
  status: 'pending_approval';
};

function defaultWeekPeriod(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function runParentCommunicationAgent(
  supabase: SupabaseClient,
  academyId: string,
  studentId: string
): Promise<{ ok: true; draft: WeeklyReportDraft } | { ok: false; error: string }> {
  const period = defaultWeekPeriod();

  await logAgentRun(supabase, {
    academyId,
    agentType: 'parent_communication',
    studentId,
    status: 'running',
    action: 'weekly_report_draft',
    result: { period },
  });

  const { data: student } = await supabase
    .from('students')
    .select('*, academies(name)')
    .eq('id', studentId)
    .eq('academy_id', academyId)
    .maybeSingle();

  if (!student) {
    await logAgentRun(supabase, {
      academyId,
      agentType: 'parent_communication',
      studentId,
      status: 'failed',
      action: 'weekly_report_draft',
      result: { error: 'student_not_found' },
    });
    return { ok: false, error: '학생을 찾을 수 없습니다.' };
  }

  const st = student as Student & { academies?: { name: string } };
  const { data: logs } = await supabase
    .from('lesson_logs')
    .select('*')
    .eq('student_id', studentId)
    .gte('lesson_date', period.start)
    .lte('lesson_date', period.end)
    .order('lesson_date', { ascending: true });

  const lessonLogs = (logs ?? []) as LessonLog[];
  const academyName = st.academies?.name ?? '학원';

  const rag = await retrieveStudentRagContext(
    supabase,
    studentId,
    '주간 학부모 리포트: 점수 숙제 출석 상담 종합'
  );

  let reportText: string;
  let source: 'gemini' | 'rules' = 'rules';

  if (isGeminiConfigured() && rag) {
    try {
      const { text } = await generateWithGemini(
        `${rag.contextText}

[기간] ${period.start} ~ ${period.end}
[학생] ${st.name} (${st.grade})

위 기록만 사용해 학부모에게 보낼 주간 리포트 초안을 작성하세요.
- 존댓말, 12~18문장, 마크다운 없음
- 수치·날짜는 기록에 있는 것만
- 마지막에 「원장 확인 후 발송」 안내 한 줄`,
        {
          systemInstruction: 'Parent Communication Agent — 주간 리포트 초안',
          temperature: 0.4,
          maxOutputTokens: 4096,
        }
      );
      reportText = text.trim();
      source = 'gemini';
    } catch {
      reportText = generateParentReport(
        lessonLogs,
        st,
        period.start,
        period.end,
        'friendly',
        academyName
      );
    }
  } else {
    reportText = generateParentReport(
      lessonLogs,
      st,
      period.start,
      period.end,
      'friendly',
      academyName
    );
  }

  const draft: WeeklyReportDraft = {
    periodStart: period.start,
    periodEnd: period.end,
    reportText,
    source,
    status: 'pending_approval',
  };

  await logAgentRun(supabase, {
    academyId,
    agentType: 'parent_communication',
    studentId,
    status: 'pending',
    action: 'weekly_report_draft',
    result: { source, period, preview: reportText.slice(0, 200) },
  });

  return { ok: true, draft };
}
