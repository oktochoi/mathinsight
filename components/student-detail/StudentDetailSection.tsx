'use client';

export function StudentDetailSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-ink-3)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
