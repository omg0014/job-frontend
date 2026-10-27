/**
 * Shared motion vocabulary. Everything here is 150–300ms and purposeful:
 * motion explains what changed, it never decorates.
 *
 * Reduced motion is honoured by `MotionConfig reducedMotion="user"` at the
 * root, which strips transforms; durations below still apply to opacity, so
 * they stay short enough to read as instant.
 */

/** Cards rise 8px and fade, staggered 40ms apart. */
export const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};

/**
 * Reduced-motion counterpart: opacity only, no vertical offset. Framer's
 * MotionConfig handles `animate`, but variant `exit` offsets still apply, so
 * the card swaps to this set when the user has asked for less motion.
 */
export const listItemReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** Detail panel: spring in from the right, so it feels attached to the click. */
export const panelSpring = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

export const backdropFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Bookmark: a quick pop to 1.2 and back — confirmation, not celebration. */
export const bookmarkPop = {
  scale: [1, 1.2, 1],
  transition: { duration: 0.26, times: [0, 0.45, 1], ease: 'easeOut' },
};

export const EASE_OUT = [0.16, 1, 0.3, 1];
