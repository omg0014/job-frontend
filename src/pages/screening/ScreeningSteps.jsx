import { clsx } from '../../lib/clsx.js';

const STEPS = ['Consent', 'Your details', 'Camera check', 'Questions', 'Done'];

/**
 * Where the candidate is in the screening round. Each page passes its own
 * position — this reads nothing from the server, it only frames the screen.
 */
export const ScreeningSteps = ({ current, className = '' }) => (
  <div className={clsx('mb-6', className)}>
    <p className="text-meta text-ink-soft">
      Video screening · Step <span className="tabular font-semibold text-ink">{current}</span> of{' '}
      <span className="tabular">{STEPS.length}</span>
      <span className="sr-only">: {STEPS[current - 1]}</span>
    </p>
    <ol className="mt-2 grid grid-cols-5 gap-1.5" aria-hidden="true">
      {STEPS.map((label, index) => (
        <li
          key={label}
          className={clsx(
            'h-1 rounded-full transition-colors duration-panel',
            index + 1 < current && 'bg-status-short-ink',
            index + 1 === current && 'bg-plum-600',
            index + 1 > current && 'bg-line',
          )}
        />
      ))}
    </ol>
  </div>
);
