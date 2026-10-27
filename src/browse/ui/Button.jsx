import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn.js';

/**
 * shadcn-style button. Hover is a 150ms ease-out; press takes a subtle scale
 * via `active:scale-[0.98]` rather than a Framer spring, so it stays
 * instantaneous under the finger.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control',
    'font-medium tracking-[-0.006em]',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out',
    'active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    'disabled:pointer-events-none disabled:opacity-45',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-purple-700 text-white hover:bg-purple-800 shadow-card',
        secondary:
          'bg-surface text-ink-700 border border-ink-200 hover:bg-ink-50 hover:border-ink-300',
        ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        subtle: 'bg-purple-50 text-purple-800 hover:bg-purple-100',
        // Gold is an outline treatment only — never a large filled area.
        gold: 'bg-gold-tint text-gold-text border border-gold-border hover:bg-[#F7E8C4]',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-[15px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
