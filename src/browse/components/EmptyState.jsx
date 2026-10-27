import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const EmptyState = ({ onReset, hasFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 bg-surface/60 px-6 py-16 text-center"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
      <SearchX className="h-5 w-5 text-ink-500" aria-hidden="true" />
    </div>

    <h3 className="mt-4 text-[15px] font-semibold tracking-heading text-ink-900">
      No jobs match these filters
    </h3>
    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">
      {hasFilters
        ? 'Try widening your salary range, adding another work mode, or clearing a tech tag.'
        : 'There are no openings to show right now. Please check back shortly.'}
    </p>

    {hasFilters ? (
      <Button variant="secondary" className="mt-5" onClick={onReset}>
        Reset all filters
      </Button>
    ) : null}
  </motion.div>
);
