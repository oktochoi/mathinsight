/**
 * EduFlow Staff Design System — CSS variable reference.
 * Source of truth: `app/globals.css` (`:root` + `.app-*` utilities).
 */

export const colorTokens = {
  background: 'var(--app-bg)',
  surface: 'var(--app-surface)',
  surface2: 'var(--app-surface-2)',
  surfaceElevated: 'var(--app-surface-elevated)',
  border: 'var(--app-border)',
  borderMd: 'var(--app-border-md)',
  borderStrong: 'var(--app-border-strong)',
  textPrimary: 'var(--app-ink)',
  textSecondary: 'var(--app-ink-2)',
  textMuted: 'var(--app-ink-3)',
  textFaint: 'var(--app-ink-4)',
  accent: 'var(--app-accent)',
  accentDark: 'var(--app-accent-dark)',
  accentBg: 'var(--app-accent-bg)',
  accentText: 'var(--app-accent-text)',
  success: 'var(--app-success)',
  successBg: 'var(--app-success-bg)',
  warning: 'var(--app-warning)',
  warningBg: 'var(--app-warning-bg)',
  danger: 'var(--app-danger)',
  dangerBg: 'var(--app-danger-bg)',
  info: 'var(--app-info)',
  infoBg: 'var(--app-info-bg)',
} as const;

export const spacingTokens = {
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
  '2xl': 'var(--space-2xl)',
  '3xl': 'var(--space-3xl)',
  pageGap: 'var(--page-gap)',
  sectionGap: 'var(--section-gap)',
  cardPadding: 'var(--card-padding)',
  cardPaddingLg: 'var(--card-padding-lg)',
} as const;

export const radiusTokens = {
  xs: 'var(--r-xs)',
  sm: 'var(--r-sm)',
  md: 'var(--r-md)',
  lg: 'var(--r-lg)',
  xl: 'var(--r-xl)',
  '2xl': 'var(--r-2xl)',
} as const;

export const shadowTokens = {
  xs: 'var(--s-xs)',
  sm: 'var(--s-sm)',
  md: 'var(--s-md)',
  lg: 'var(--s-lg)',
} as const;

export const transitionTokens = {
  fast: 'var(--t-fast)',
  base: 'var(--t-base)',
  slow: 'var(--t-slow)',
  spring: 'var(--t-spring)',
} as const;

/** Typography utility class names (apply via `className`) */
export const typographyClasses = {
  pageTitle: 'app-page-title',
  sectionTitle: 'app-section-title',
  cardTitle: 'app-card-title',
  display: 'app-display',
  title: 'app-title',
  subtitle: 'app-subtitle',
  body: 'app-body',
  caption: 'app-caption',
  muted: 'app-muted',
  label: 'app-label',
  metric: 'app-metric',
  kpi: 'app-kpi',
  kpiLg: 'app-kpi-lg',
} as const;

/** Button utility class combinations */
export const buttonClasses = {
  base: 'app-btn',
  primary: 'app-btn app-btn-primary',
  secondary: 'app-btn app-btn-secondary',
  ghost: 'app-btn app-btn-ghost',
  danger: 'app-btn app-btn-danger',
  sm: 'app-btn-sm',
  lg: 'app-btn-lg',
  icon: 'app-btn-icon',
} as const;

/** Card utility class names */
export const cardClasses = {
  base: 'app-card',
  sm: 'app-card-sm',
  hover: 'app-card-hover',
  elevated: 'app-card-elevated',
  flat: 'app-card-flat',
} as const;
