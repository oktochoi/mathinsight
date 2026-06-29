import type { DashboardStats } from '@/types/database';

/** Rule-based AI 운영 요약 (no LLM) */
export function buildMorningBrief(stats: Pick<
  DashboardStats,
  | 'todayLessonCount'
  | 'absentTodayCount'
  | 'lateTodayCount'
  | 'missingHomeworkCount'
  | 'pendingConsultationCount'
  | 'consultationRecommendedCount'
  | 'attentionStudents'
  | 'makeupNeededCount'
  | 'overduePaymentsCount'
  | 'retentionHighRiskCount'
  | 'pendingParentMessagesCount'
  | 'todayCounselingQueue'
> & {
  insightLines?: string[];
}): string[] {
  const lines: string[] = [];

  if (stats.insightLines?.length) {
    lines.push(...stats.insightLines.slice(0, 2));
  }

  if (stats.pendingParentMessagesCount > 0) {
    lines.push(
      `학부모 문의 ${stats.pendingParentMessagesCount}건이 답변을 기다리고 있습니다.`
    );
  }

  if (stats.retentionHighRiskCount > 0) {
    lines.push(
      `재등록 확인 필요 학생 ${stats.retentionHighRiskCount}명 — 상담·학부모 연락을 검토하세요.`
    );
  }

  if (stats.missingHomeworkCount > 0) {
    lines.push(`숙제 미제출 ${stats.missingHomeworkCount}명 — 오늘 수업·숙제 화면에서 확인하세요.`);
  }

  if (stats.todayCounselingQueue.length > 0) {
    const names = stats.todayCounselingQueue
      .slice(0, 2)
      .map((q) => q.studentName)
      .join(', ');
    lines.push(`오늘 상담 예정 ${stats.todayCounselingQueue.length}건 (${names}${stats.todayCounselingQueue.length > 2 ? ' 외' : ''}).`);
  }

  if (stats.attentionStudents.length > 0 && lines.length < 3) {
    const top = stats.attentionStudents[0];
    lines.push(`${top.name} 학생 등 확인 권장 학생 ${stats.attentionStudents.length}명을 확인하세요.`);
  }

  if (lines.length === 0) {
    lines.push(
      `오늘 수업 ${stats.todayLessonCount}개 예정 — 출결·숙제 입력을 마치면 AI 추천이 더 정확해집니다.`
    );
  }

  return lines.slice(0, 3);
}
