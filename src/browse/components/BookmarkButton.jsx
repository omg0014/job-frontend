import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { bookmarkPop } from '../lib/motion.js';

/**
 * Saved state is the one place gold carries meaning rather than decoration:
 * the icon fills #D4A017. That is a graphic, not text, so the 2.38:1 contrast
 * of the raw gold is not a WCAG text failure — but the button still needs a
 * non-colour cue, which `aria-pressed` plus the filled/unfilled shape provides.
 */
export const BookmarkButton = ({ saved, onToggle, jobTitle, className, size = 'md' }) => {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  const handleClick = (event) => {
    event.stopPropagation();
    // Pop only when saving — un-saving should feel quiet.
    if (!saved && !reduceMotion) controls.start(bookmarkPop);
    onToggle();
  };

  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${jobTitle} from saved jobs` : `Save ${jobTitle}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control',
        dimension,
        'transition-colors duration-150 ease-out',
        'hover:bg-ink-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      )}
    >
      <motion.span animate={controls} className="inline-flex">
        <Bookmark
          className={cn(
            iconSize,
            'transition-colors duration-150 ease-out',
            saved ? 'text-gold fill-gold' : 'text-ink-400',
          )}
          aria-hidden="true"
        />
      </motion.span>
    </button>
  );
};
