'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

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
      <label className="auth-label">{label}</label>
      {children}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('auth-input', props.className)} />;
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
        className={cn('auth-input pr-10', props.className)}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--auth-muted)' }}
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
  type = 'submit',
  onClick,
  disabled,
}: {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'submit' | 'button';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={{ scale: loading || disabled ? 1 : 1.01 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.98 }}
      className={cn('auth-btn-primary', className)}
    >
      {children}
    </motion.button>
  );
}
