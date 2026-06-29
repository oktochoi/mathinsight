import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** className 조합 (tailwind-merge) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
