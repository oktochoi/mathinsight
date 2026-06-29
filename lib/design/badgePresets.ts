import type { StatusBadgeTone } from '@/components/data-ui/StatusBadge';

export type EduBadgePreset =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'action_needed'
  | 'unpaid'
  | 'paid'
  | 'overdue'
  | 'stable'
  | 'attention'
  | 'risk'
  | 'info'
  | 'ai';

export const BADGE_PRESETS: Record<
  EduBadgePreset,
  { label: string; tone: StatusBadgeTone; dot?: boolean }
> = {
  scheduled: { label: '예정', tone: 'info' },
  in_progress: { label: '진행 중', tone: 'info', dot: true },
  completed: { label: '완료', tone: 'success' },
  action_needed: { label: '마감 필요', tone: 'warning', dot: true },
  unpaid: { label: '미납', tone: 'warning' },
  paid: { label: '완납', tone: 'success' },
  overdue: { label: '연체', tone: 'danger', dot: true },
  stable: { label: '정상', tone: 'success' },
  attention: { label: '관심', tone: 'warning', dot: true },
  risk: { label: '상담 권장', tone: 'danger', dot: true },
  info: { label: '정보', tone: 'neutral' },
  ai: { label: 'AI', tone: 'ai' },
};
