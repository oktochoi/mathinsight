'use client';

import { cn } from '@/lib/cn';
import { CardTitle, Caption, MutedText } from './Typography';
import { Button } from './Button';

export function AppDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  'aria-label': ariaLabel = '상세 패널',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}) {
  if (!open) return null;

  const widthClass =
    width === 'sm' ? 'max-w-sm' : width === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <>
      <button type="button" aria-label="닫기" className="app-overlay" onClick={onClose} />
      <aside className={cn('app-drawer', widthClass)} role="dialog" aria-label={ariaLabel}>
        <header className="app-drawer-header">
          <div className="min-w-0">
            {subtitle && <Caption>{subtitle}</Caption>}
            <CardTitle className={subtitle ? 'mt-0.5 text-lg' : 'text-lg'}>{title}</CardTitle>
          </div>
          <Button variant="ghost" iconOnly size="sm" onClick={onClose} aria-label="닫기">
            <i className="ri-close-line text-xl" />
          </Button>
        </header>
        <div className="app-drawer-body">{children}</div>
        {footer && <footer className="app-drawer-footer">{footer}</footer>}
      </aside>
    </>
  );
}

export function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;

  const panelWidth =
    size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <>
      <button type="button" aria-label="닫기" className="app-overlay" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className={cn('app-modal-panel pointer-events-auto w-full', panelWidth)}>
          <header className="app-modal-header">
            <CardTitle id="app-modal-title" className="text-lg">
              {title}
            </CardTitle>
            {description && <MutedText className="mt-1">{description}</MutedText>}
          </header>
          <div className="app-modal-body">{children}</div>
          {footer && <footer className="app-modal-footer">{footer}</footer>}
        </div>
      </div>
    </>
  );
}
