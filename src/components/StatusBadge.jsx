import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from './ui.jsx';
import {
  APPLICATION_STATUS,
  PIPELINE_STEPS,
  JOB_STATUS,
  INTERVIEW_OUTCOME,
} from '../lib/constants.js';
import { clsx } from '../lib/clsx.js';

export const StatusBadge = ({ status, className = '' }) => {
  const config = APPLICATION_STATUS[status] ?? APPLICATION_STATUS.applied;
  return <Badge className={clsx(config.className, className)}>{config.label}</Badge>;
};

export const JobStatusBadge = ({ status }) => {
  const config = JOB_STATUS[status] ?? JOB_STATUS.draft;
  return <Badge className={config.className}>{config.label}</Badge>;
};

export const OutcomeBadge = ({ outcome }) => {
  const config = INTERVIEW_OUTCOME[outcome] ?? INTERVIEW_OUTCOME.pending;
  return <Badge className={config.className}>{config.label}</Badge>;
};

/**
 * The pipeline stepper. A teacher checking their phone should understand their
 * position in under two seconds without reading, so the filled segment and the
 * deepening teal do the work before the labels are read.
 *
 * On advance, the filled segment grows left to right over 320ms and the new
 * dot scales from 0.8 to 1.
 */
export const PipelineStepper = ({ status, compact = false }) => {
  const reduceMotion = useReducedMotion();

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 rounded-control bg-status-rejected px-3 py-2.5">
        <span className="text-ui font-semibold text-status-rejected-ink">
          This application was not taken forward.
        </span>
      </div>
    );
  }

  const total = PIPELINE_STEPS.length;
  const currentIndex = PIPELINE_STEPS.indexOf(status);
  const progress = currentIndex <= 0 ? 0 : currentIndex / (total - 1);
  // The track runs from the centre of the first dot to the centre of the last,
  // so neither end pokes out past the stages it connects.
  const inset = `${50 / total}%`;
  const currentLabel = APPLICATION_STATUS[PIPELINE_STEPS[Math.max(currentIndex, 0)]]?.label;

  return (
    <div>
      <ol className="relative flex items-start" aria-label="Application progress">
        <span
          aria-hidden="true"
          className="absolute top-[11px] h-0.5 rounded-full bg-line"
          style={{ left: inset, right: inset }}
        />
        {/* The filled portion animates scaleX — transform only, never layout. */}
        <motion.span
          aria-hidden="true"
          className="absolute top-[11px] h-0.5 origin-left rounded-full bg-status-interview-ink"
          style={{ left: inset, right: inset }}
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        />

        {PIPELINE_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const config = APPLICATION_STATUS[step];

          return (
            <li
              key={step}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-2"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <motion.span
                initial={reduceMotion || !isCurrent ? false : { scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                className={clsx(
                  'relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  isDone && 'bg-status-interview-ink text-white',
                  isCurrent && 'bg-plum-600 text-white ring-4 ring-plum-100',
                  !isDone && !isCurrent && 'border border-line bg-card text-ink-soft',
                )}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : index + 1}
              </motion.span>

              {/* Six labels cannot share a 360px row without colliding, so on
                  a phone they give way to the single caption below. */}
              {!compact ? (
                <span
                  className={clsx(
                    'hidden px-0.5 text-center text-meta leading-tight sm:block',
                    isCurrent ? 'font-semibold text-plum-800' : isDone ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  <span className="sr-only">
                    {isDone ? 'Done: ' : isCurrent ? 'Current: ' : 'Upcoming: '}
                  </span>
                  {config.label}
                </span>
              ) : (
                <span className="sr-only">
                  {config.label}
                  {isDone ? ', done' : isCurrent ? ', current' : ''}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {!compact ? (
        <p className="mt-3 text-center text-ui text-ink-soft sm:hidden">
          Step <span className="tabular font-semibold text-ink">{Math.max(currentIndex, 0) + 1}</span> of{' '}
          <span className="tabular">{total}</span>
          <span className="mx-1.5 text-line">·</span>
          <span className="font-semibold text-plum-800">{currentLabel}</span>
        </p>
      ) : null}
    </div>
  );
};
