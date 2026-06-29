import { StatusBadge, type StatusBadgeTone } from '@/components/data-ui/StatusBadge';
import { BADGE_PRESETS, type EduBadgePreset } from '@/lib/design/badgePresets';

export type { StatusBadgeTone, EduBadgePreset };

/** Staff 표준 Badge — `data-ui/StatusBadge` + 도메인 프리셋 */
export function EduBadge({
  preset,
  label,
  tone,
  size = 'md',
  dot,
  className,
}: {
  preset?: EduBadgePreset;
  label?: string;
  tone?: StatusBadgeTone;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}) {
  if (preset) {
    const p = BADGE_PRESETS[preset];
    return (
      <StatusBadge
        label={label ?? p.label}
        tone={tone ?? p.tone}
        size={size}
        dot={dot ?? p.dot}
        className={className}
      />
    );
  }

  if (!label) return null;

  return (
    <StatusBadge label={label} tone={tone} size={size} dot={dot} className={className} />
  );
}

/** @deprecated DashboardPrimitives StatusBadge 대신 EduBadge 사용 권장 */
export { StatusBadge };
