import { getLessonFlowState } from '@/lib/learningFlow';
import type {
  AttentionStudent,
  DashboardChecklistItem,
  DashboardRetentionRisk,
  DashboardStats,
  DashboardAiRecommendation,
} from '@/types/database';

export interface OperationsSummaryChip {
  label: string;
  value: number;
  unit: string;
  tone: 'neutral' | 'warning' | 'danger' | 'info';
  href?: string;
}

export function computePendingAttendanceInput(stats: DashboardStats): number {
  const today = new Date().toISOString().slice(0, 10);
  let count = stats.unclosedLessonsToday.length;
  for (const item of stats.todayLessons) {
    const state = getLessonFlowState(item, today);
    if (state.emphasizeRecord) count++;
  }
  return count;
}

export function computePendingHomeworkCheck(stats: DashboardStats): number {
  return stats.missingHomeworkCount;
}

export function buildTodayChecklist(stats: DashboardStats): DashboardChecklistItem[] {
  const pendingAttendance = stats.pendingAttendanceInputCount;
  const pendingHomework = stats.pendingHomeworkCheckCount;
  const pendingMessages = stats.pendingParentMessagesCount;
  const counselingToday = stats.todayCounselingQueue.length;
  const retentionPending = stats.retentionHighRiskCount || stats.retentionRiskStudents.length;

  return [
    {
      id: 'attendance',
      label: '출결 입력',
      detail: pendingAttendance > 0 ? `${pendingAttendance}건 미입력` : '입력 완료',
      href: '/lesson-logs',
      done: pendingAttendance === 0,
      pendingCount: pendingAttendance,
    },
    {
      id: 'homework',
      label: '숙제 확인',
      detail: pendingHomework > 0 ? `${pendingHomework}건 미확인` : '확인 완료',
      href: '/homework',
      done: pendingHomework === 0,
      pendingCount: pendingHomework,
    },
    {
      id: 'messages',
      label: '학부모 문의 답변',
      detail: pendingMessages > 0 ? `${pendingMessages}건 대기` : '답변 완료',
      href: '/messages',
      done: pendingMessages === 0,
      pendingCount: pendingMessages,
    },
    {
      id: 'counseling',
      label: '상담 예정 학생',
      detail: counselingToday > 0 ? `${counselingToday}명 예정` : '예정 없음',
      href: '/counseling?step=session',
      done: counselingToday === 0,
      pendingCount: counselingToday,
    },
    {
      id: 'retention',
      label: '재등록 안내',
      detail: retentionPending > 0 ? `${retentionPending}명 확인 권장` : '확인 완료',
      href: '/retention',
      done: retentionPending === 0,
      pendingCount: retentionPending,
    },
  ];
}

export function buildOperationsSummary(stats: DashboardStats): OperationsSummaryChip[] {
  return [
    {
      label: '오늘 수업',
      value: stats.todayLessonCount,
      unit: '개',
      tone: 'neutral',
      href: '/lesson-logs',
    },
    {
      label: '출결 미입력',
      value: stats.pendingAttendanceInputCount,
      unit: '건',
      tone: stats.pendingAttendanceInputCount > 0 ? 'warning' : 'neutral',
      href: '/lesson-logs',
    },
    {
      label: '숙제 미확인',
      value: stats.pendingHomeworkCheckCount,
      unit: '건',
      tone: stats.pendingHomeworkCheckCount > 0 ? 'warning' : 'neutral',
      href: '/homework',
    },
    {
      label: '상담 예정',
      value: stats.todayCounselingQueue.length,
      unit: '건',
      tone: stats.todayCounselingQueue.length > 0 ? 'info' : 'neutral',
      href: '/counseling?step=session',
    },
    {
      label: '학부모 문의',
      value: stats.pendingParentMessagesCount,
      unit: '건',
      tone: stats.pendingParentMessagesCount > 0 ? 'danger' : 'neutral',
      href: '/messages',
    },
  ];
}

const LEARNING_STATUS_LABEL: Record<string, string> = {
  consultation: '상담 검토',
  makeup: '보강 필요',
  attention: '보강 권장',
  recovering: '회복 중',
  stable: '양호',
};

export function mapLearningStatusLabel(label: string, riskKind?: string): string {
  if (riskKind && LEARNING_STATUS_LABEL[riskKind]) return LEARNING_STATUS_LABEL[riskKind];
  if (label.includes('신호')) return label.replace('신호', '현황');
  if (label.includes('위험')) return '상담 권장';
  return label;
}

export function buildAiRecommendations(
  attention: AttentionStudent[],
  worsening: AttentionStudent[],
  retention: DashboardRetentionRisk[]
): DashboardAiRecommendation[] {
  const items: DashboardAiRecommendation[] = [];

  for (const s of worsening.slice(0, 3)) {
    items.push({
      id: `counsel-${s.id}`,
      studentId: s.id,
      studentName: s.name,
      reason: s.reason || '최근 학습 현황 변화가 있습니다.',
      category: 'counseling',
      href: `/counseling?step=session&student=${s.id}`,
    });
  }

  for (const s of attention.filter((a) => a.riskKind === 'attention' || a.riskKind === 'makeup').slice(0, 2)) {
    if (items.some((i) => i.studentId === s.id)) continue;
    items.push({
      id: `learn-${s.id}`,
      studentId: s.id,
      studentName: s.name,
      reason: s.reason || '최근 학습 현황을 확인해 주세요.',
      category: 'learning',
      href: `/students/${s.id}`,
    });
  }

  for (const r of retention.slice(0, 3)) {
    if (items.some((i) => i.studentId === r.studentId)) continue;
    items.push({
      id: `retention-${r.studentId}`,
      studentId: r.studentId,
      studentName: r.name,
      reason: r.reason || '재등록 상담을 검토해 주세요.',
      category: 'retention',
      href: `/retention?student=${r.studentId}`,
    });
  }

  return items.slice(0, 6);
}

export function checklistProgress(checklist: DashboardChecklistItem[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = checklist.length;
  const done = checklist.filter((c) => c.done).length;
  return { done, total, percent: total === 0 ? 100 : Math.round((done / total) * 100) };
}
