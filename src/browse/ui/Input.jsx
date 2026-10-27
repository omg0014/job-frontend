import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-control border border-ink-200 bg-surface px-3 text-sm text-ink-900',
      'placeholder:text-ink-400',
      'transition-[border-color,box-shadow] duration-150 ease-out',
      'hover:border-ink-300',
      'focus:outline-none focus-visible:border-purple-700 focus-visible:ring-2 focus-visible:ring-purple-700/20',
      'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-control border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900',
      'placeholder:text-ink-400 leading-relaxed',
      'transition-[border-color,box-shadow] duration-150 ease-out',
      'hover:border-ink-300',
      'focus:outline-none focus-visible:border-purple-700 focus-visible:ring-2 focus-visible:ring-purple-700/20',
      'disabled:cursor-not-allowed disabled:bg-ink-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
