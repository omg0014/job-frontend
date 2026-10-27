import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, IndianRupee, Briefcase, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { BookmarkButton } from './BookmarkButton.jsx';
import { cn } from '../lib/cn.js';
import { listItem, listItemReduced } from '../lib/motion.js';
import { formatLpa, formatExperience, formatPostedAt, LOGO_TONES } from '../lib/format.js';

const WORK_MODE_STYLES = {
  Remote: 'text-emerald-700',
  Hybrid: 'text-purple-700',
  'On-site': 'text-ink-500',
};

/**
 * A single result. The whole card is the click target, with the bookmark as a
 * nested control — so the card is a <div role="button"> rather than a <button>
 * wrapping another button, which is invalid and breaks keyboard order.
 */
export const JobCard = forwardRef(({ job, saved, onToggleSave, onOpen, isActive }, ref) => {
  // MotionConfig strips transforms from `animate`, but variant `exit` values
  // still run, so opt the card's own offsets out explicitly.
  const reduceMotion = useReducedMotion();

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.article
      ref={ref}
      layout="position"
      variants={reduceMotion ? listItemReduced : listItem}
      initial="hidden"
      animate="show"
      exit="exit"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`${job.title} at ${job.company}`}
      className={cn(
        'group relative cursor-pointer rounded-card border bg-surface p-5',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        'hover:border-ink-300 hover:shadow-lift',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        isActive ? 'border-purple-700 shadow-lift' : 'border-ink-200',
      )}
    >
      {/* Featured jobs get a thin gold rule at the top edge — the accent as a
          1px line, never a filled area. */}
      {job.featured ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-t-card"
        >
          {/* Fades out well before the card edges so it reads as an accent
              rule, not a filled bar. */}
          <span className="absolute inset-x-[18%] top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        </span>
      ) : null}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold ring-1',
            LOGO_TONES[job.logoTone] ?? LOGO_TONES.slate,
          )}
          aria-hidden="true"
        >
          {job.logoText}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-[15px] font-semibold leading-snug tracking-heading text-ink-900 transition-colors duration-150 group-hover:text-purple-800">
                  {job.title}
                </h3>
                {job.featured ? (
                  <Badge variant="gold" size="sm" className="gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Featured
                  </Badge>
                ) : null}
              </div>

              <p className="mt-1 text-[13px] text-ink-600">
                {job.company}
                <span className="mx-1.5 text-ink-300" aria-hidden="true">·</span>
                <span className={WORK_MODE_STYLES[job.workMode]}>{job.workMode}</span>
              </p>
            </div>

            <BookmarkButton
              saved={saved}
              onToggle={onToggleSave}
              jobTitle={job.title}
              size="sm"
              className="-mr-1.5 -mt-1.5"
            />
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-600">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Location</dt>
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              <dd>{job.location}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Salary</dt>
              <IndianRupee className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              <dd className="font-medium text-ink-800">
                {formatLpa(job.salaryMin, job.salaryMax)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Experience</dt>
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              <dd>{formatExperience(job.expMin, job.expMax)}</dd>
            </div>
          </dl>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {job.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
        <span className="text-xs text-ink-500">{formatPostedAt(job.postedAt)}</span>
        <span className="text-xs text-ink-500">
          {job.applicants} applicant{job.applicants === 1 ? '' : 's'}
        </span>
      </div>
    </motion.article>
  );
});
JobCard.displayName = 'JobCard';
