import type {
  CounselingSessionStatus,
  CounselingSessionType,
} from '@/types/database';

export const COUNSELING_TYPE_LABELS: Record<CounselingSessionType, string> = {
  parent: '학부모 상담',
  student: '학생 상담',
  learning: '학습 상담',
  reregistration: '재등록 상담',
  intake: '신입 원생 상담',
};

export const COUNSELING_STATUS_LABELS: Record<CounselingSessionStatus, string> = {
  scheduled: '예정',
  in_progress: '진행 중',
  completed: '완료',
  followup_needed: '후속조치 필요',
};

export const COUNSELING_STATUS_STYLES: Record<CounselingSessionStatus, string> = {
  scheduled: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  followup_needed: 'bg-violet-50 text-violet-800 border-violet-200',
};
