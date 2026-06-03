import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { fetchLatestAgentLogs } from '@/lib/agents/log';

const AGENT_LABELS: Record<string, string> = {
  risk_detection: '학습 점검',
  counseling: '상담 준비',
  parent_communication: '학부모 리포트',
  parent_rag: '학부모 AI',
  dashboard: '대시보드',
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const limit = Math.min(
      Number(new URL(request.url).searchParams.get('limit') ?? '25'),
      50
    );

    const logs = await fetchLatestAgentLogs(supabase, auth.academyId, limit);

    const feed = logs.map((log) => {
      const time = new Date(log.created_at).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const label = AGENT_LABELS[log.agent_type] ?? log.agent_type;
      const studentPart =
        log.result && typeof log.result === 'object' && 'studentName' in log.result
          ? String((log.result as { studentName: string }).studentName)
          : '';

      let message = log.action;
      if (log.agent_type === 'risk_detection' && log.action.includes('scan')) {
        message = '전체 학생 학습 상태 점검 완료';
      }
      if (log.agent_type === 'risk_detection' && log.action.includes('assessed') && studentPart) {
        message = `${studentPart} 학생 — 조치 필요 여부 분류`;
      }
      if (log.agent_type === 'counseling') {
        message = studentPart
          ? `${studentPart} 학생 상담 카드·요약 생성`
          : '상담 카드 초안 생성';
      }
      if (log.agent_type === 'parent_communication') {
        message = studentPart
          ? `${studentPart} 학생 주간 리포트 초안`
          : '학부모 주간 리포트 초안 생성';
      }
      if (log.agent_type === 'dashboard' && log.action.includes('proactive')) {
        message = '오늘 아침 자동 점검·상담 준비 완료';
      }

      return {
        id: log.id,
        time,
        agentLabel: label,
        agentType: log.agent_type,
        status: log.status,
        message,
        studentId: log.student_id,
        createdAt: log.created_at,
      };
    });

    const { data: riskCounts } = await supabase
      .from('student_risk_signals')
      .select('risk_level, student_id')
      .eq('academy_id', auth.academyId)
      .order('created_at', { ascending: false });

    const latest = new Map<string, string>();
    for (const r of riskCounts ?? []) {
      if (!latest.has(r.student_id)) latest.set(r.student_id, r.risk_level);
    }
    let consultation = 0;
    let makeup = 0;
    let attention = 0;
    for (const level of latest.values()) {
      if (level === 'consultation') consultation += 1;
      if (level === 'makeup') makeup += 1;
      if (level === 'attention') attention += 1;
    }

    return NextResponse.json({
      ok: true,
      feed,
      notifications: {
        consultation,
        makeup,
        attention,
        message:
          consultation + makeup + attention > 0
            ? `오늘 연락·상담을 검토할 학생이 있습니다.`
            : '',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
