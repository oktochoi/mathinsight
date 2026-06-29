'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const baseInput =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100';

export function AuthField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseInput, props.className)} />;
}

export function AuthPasswordInput({
  show,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={cn(baseInput, 'pr-10', props.className)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
      >
        <i className={show ? 'ri-eye-off-line' : 'ri-eye-line'} />
      </button>
    </div>
  );
}

export function AuthSubmitButton({
  loading,
  children,
  className,
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.01 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex w-full items-center justify-center rounded-full bg-gradient-to-b from-lime-500 to-green-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-green-600/30 transition-opacity disabled:opacity-50',
        className
      )}
    >
      {children}
    </motion.button>
  );
}
