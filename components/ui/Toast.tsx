'use client';

type Props = {
  message: string;
  variant?: 'success' | 'error';
};

export function Toast({ message, variant = 'success' }: Props) {
  if (!message) return null;

  const bg = variant === 'error' ? 'bg-rose-600' : 'bg-emerald-600';

  return (
    <div
      className={`fixed top-20 right-8 z-50 rounded-xl px-5 py-3 text-sm text-white shadow-lg ${bg}`}
      role="status"
    >
      {message}
    </div>
  );
}
