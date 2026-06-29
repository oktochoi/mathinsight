'use client';

import { cn } from '@/lib/cn';
import { Button } from './Button';
import { CardTitle, MutedText } from './Typography';

export function AppEmptyState({
  placeholder = 'Empty State Placeholder',
  title,
  description,
  primaryAction,
  secondaryAction,
  icon = 'ri-inbox-line',
  className,
}: {
  placeholder?: string;
  title: string;
  description?: string;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  icon?: string;
  className?: string;
}) {
  return (
    <div className={cn('app-empty', className)}>
      <div
        className="w-full max-w-xs rounded-xl px-4 py-8 mb-2 text-xs font-medium text-center"
        style={{
          background: 'var(--app-surface-2)',
          border: '1px dashed var(--app-border-md)',
          color: 'var(--app-ink-4)',
        }}
      >
        [ Illustration Placeholder — {placeholder} ]
      </div>
      <div className="app-empty-icon">
        <i className={icon} />
      </div>
      <CardTitle className="text-base">{title}</CardTitle>
      {description && <MutedText className="max-w-sm">{description}</MutedText>}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {primaryAction &&
            (primaryAction.href ? (
              <Button href={primaryAction.href} size="sm">
                {primaryAction.label}
              </Button>
            ) : (
              <Button size="sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Button href={secondaryAction.href} variant="secondary" size="sm">
                {secondaryAction.label}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
