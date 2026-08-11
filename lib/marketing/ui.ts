/** EduFlow 마케팅 — Carefor 스타일 디자인 토큰 (Tailwind only) */

export const mkt = {
  site: 'mkt-typo min-h-screen bg-white text-slate-800 antialiased font-sans',
  container: 'mx-auto max-w-[1100px] px-4 md:px-6',
  containerNarrow: 'mx-auto max-w-[1100px] px-4 md:px-6',
  containerWide: 'mx-auto max-w-[1100px] px-4 md:px-6',

  /* Typography — Hangul + Pretendard 기준 자간/두께 */
  eyebrow: 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700',
  h1: 'text-[clamp(1.85rem,4.2vw,2.75rem)] font-bold leading-[1.15] tracking-[-0.03em] text-slate-900',
  h2: 'text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.2] tracking-[-0.025em] text-slate-900',
  h3: 'text-lg font-bold leading-snug tracking-[-0.02em] text-slate-900',
  lead: 'text-[17px] leading-[1.75] tracking-[-0.012em] text-slate-600 md:text-lg',
  body: 'text-[15px] leading-[1.7] tracking-[-0.01em] text-slate-600',
  muted: 'text-sm leading-relaxed tracking-[-0.01em] text-slate-500',
  link: 'font-semibold tracking-[-0.01em] text-teal-700 hover:underline underline-offset-2',

  /* Layout */
  section: 'py-12 md:py-16',
  sectionSm: 'py-10 md:py-12',
  sectionMuted: 'bg-slate-50',
  divider: 'border-t border-slate-200',

  /* Carefor buttons */
  btnGreen:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[-0.01em] text-white bg-emerald-700 shadow-md shadow-emerald-900/20 hover:bg-emerald-800 hover:-translate-y-px transition-all',
  btnGreenSm:
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold tracking-[-0.01em] text-white bg-emerald-700 shadow-md shadow-emerald-900/20 hover:bg-emerald-800 hover:-translate-y-px transition-all',
  btnOrange:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[-0.01em] text-white bg-gradient-to-b from-orange-400 to-orange-600 shadow-md shadow-orange-500/35 hover:-translate-y-px transition-transform',
  btnOutline:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-700 bg-white border border-slate-200 hover:bg-slate-50',
  btnOutlineLight:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[-0.01em] text-white border border-white/40 hover:bg-white/10',

  btnPrimary:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[-0.01em] text-white bg-emerald-700 shadow-md shadow-emerald-900/20 hover:bg-emerald-800 hover:-translate-y-px transition-all',
  btnSecondary:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-700 bg-white border border-slate-200 hover:bg-slate-50',
  btnAccent:
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[-0.01em] text-white bg-gradient-to-b from-orange-400 to-orange-600 shadow-md shadow-orange-500/35 hover:-translate-y-px transition-transform',
  btnGhost: 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium tracking-[-0.01em] text-slate-600 hover:bg-emerald-50 hover:text-teal-700',

  /* Brand */
  logo: 'flex items-center gap-2.5 shrink-0',
  logoMark:
    'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-lg text-white shadow-md shadow-teal-600/25',
  logoText: 'text-xl font-bold tracking-[-0.025em] text-slate-800',

  /* Badges */
  badgeAi: 'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] bg-violet-50 text-violet-700',
  badgeRisk: 'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] bg-amber-50 text-amber-800',
  badgeNeutral: 'inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-[-0.01em] bg-slate-100 text-slate-600',

  /* Cards */
  card: 'rounded-2xl border border-slate-200 bg-white shadow-sm',
  cardHover: 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/8',
  cardBlue: 'rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20',

  /* Forms */
  input:
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm tracking-[-0.01em] text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100',
  label: 'mb-1.5 block text-xs font-semibold tracking-[-0.01em] text-slate-500',
  fieldLabel: 'text-sm font-semibold tracking-[-0.01em] text-slate-600',
  fieldInput:
    'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm tracking-[-0.01em] text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100',
  fieldFull: 'sm:col-span-2',

  accent: 'text-teal-700',
  sectionTitle: 'text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.2] tracking-[-0.025em] text-slate-900',
  sectionDesc: 'mt-2 text-base leading-[1.7] tracking-[-0.012em] text-slate-600',
  prose: 'max-w-2xl space-y-5 text-slate-600 leading-7 tracking-[-0.01em]',
  contactGrid: 'grid gap-10 lg:grid-cols-[0.85fr_1.15fr]',
  contactEmail: 'mt-3 block text-xl font-bold tracking-[-0.02em] text-teal-800',
  contactMeta: 'mt-2 text-sm leading-relaxed tracking-[-0.01em] text-slate-600',
  contactDivider: 'my-5 border-t border-slate-200',
  contactForm: 'grid gap-4 sm:grid-cols-2',
} as const;

export const HERO_BG: Record<string, string> = {
  peach: 'bg-gradient-to-br from-orange-50 via-orange-100/90 to-orange-200/70',
  sky: 'bg-gradient-to-br from-sky-50 to-blue-100',
  mint: 'bg-gradient-to-br from-emerald-50 to-teal-100',
};
