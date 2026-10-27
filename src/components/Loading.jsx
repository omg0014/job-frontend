import { Loader2 } from 'lucide-react';
import { clsx } from '../lib/clsx.js';

export const Spinner = ({ className = '' }) => (
  <Loader2 className={clsx('h-4 w-4 animate-spin', className)} aria-hidden="true" />
);

export const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-paper">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-plum-600" aria-hidden="true" />
      <p className="text-ui text-ink-soft">Loading…</p>
    </div>
  </div>
);

/** Skeletons stand in for content while it loads, so layout never jumps. */
/**
 * A 1.5s linear shimmer rather than an opacity pulse — it reads as loading
 * rather than blinking, and stops entirely under prefers-reduced-motion.
 */
export const Skeleton = ({ className = '' }) => (
  <div className={clsx('relative overflow-hidden rounded-control bg-line/70', className)}>
    <span
      aria-hidden="true"
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:hidden"
    />
  </div>
);

export const CardSkeleton = () => (
  <div className="rounded-card border border-line/80 bg-field shadow-card p-5">
    <Skeleton className="h-5 w-2/5" />
    <Skeleton className="mt-3 h-3 w-3/5" />
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      // eslint-disable-next-line react/no-array-index-key -- placeholders are static
      <CardSkeleton key={index} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      // eslint-disable-next-line react/no-array-index-key -- placeholders are static
      <div key={index} className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    ))}
  </div>
);
