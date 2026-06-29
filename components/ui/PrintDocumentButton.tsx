'use client';

export function PrintDocumentButton({
  label = 'PDF / 인쇄',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 cursor-pointer no-print'
      }
    >
      <i className="ri-printer-line" />
      {label}
    </button>
  );
}
