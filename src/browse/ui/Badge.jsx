import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

/**
 * Note the gold variant: a warm tint background with gold.text on top
 * (5.65:1). The raw #D4A017 never carries text.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border font-medium tracking-[-0.004em] whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-ink-50 text-ink-600 border-ink-200',
        purple: 'bg-purple-50 text-purple-800 border-purple-200',
        gold: 'bg-gold-tint text-gold-text border-gold-border',
        outline: 'bg-transparent text-ink-600 border-ink-200',
        success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[11px]',
        md: 'px-2 py-0.5 text-xs',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

export const Badge = ({ className, variant, size, ...props }) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
);
