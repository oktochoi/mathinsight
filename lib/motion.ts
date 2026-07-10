/** 마케팅 모션 상수 — 전 구간 동일 easing/duration으로 통일 (10K 체크리스트: 컬러·모션 일관성) */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.3,
  base: 0.55,
  slow: 1.1,
} as const;
