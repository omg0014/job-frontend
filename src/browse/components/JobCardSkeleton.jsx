import { cn } from '../lib/cn.js';

/**
 * Shimmer runs via a translating gradient rather than an opacity pulse, so it
 * reads as loading rather than blinking. `motion-reduce:animate-none` stops it
 * entirely for users who ask for less motion.
 */
const Shimmer = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded bg-ink-100', className)}>
    <div
      aria-hidden="true"
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:animate-none"
    />
  </div>
);

export const JobCardSkeleton = () => (
  <div className="rounded-card border border-ink-200 bg-surface p-5">
    <div className="flex items-start gap-4">
      <Shimmer className="h-11 w-11 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <Shimmer className="h-4 w-[52%]" />
        <Shimmer className="mt-2.5 h-3 w-[34%]" />
        <div className="mt-4 flex gap-4">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-3 w-16" />
        </div>
        <div className="mt-4 flex gap-1.5">
          <Shimmer className="h-5 w-14 rounded-md" />
          <Shimmer className="h-5 w-20 rounded-md" />
          <Shimmer className="h-5 w-16 rounded-md" />
        </div>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
      <Shimmer className="h-3 w-16" />
      <Shimmer className="h-3 w-20" />
    </div>
  </div>
);

export const JobListSkeleton = ({ count = 5 }) => (
  <div className="space-y-3" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading jobs…</span>
    {Array.from({ length: count }).map((_, index) => (
      // eslint-disable-next-line react/no-array-index-key -- placeholders are static
      <JobCardSkeleton key={index} />
    ))}
  </div>
);
