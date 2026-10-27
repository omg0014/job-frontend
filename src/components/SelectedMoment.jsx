import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { MeritBadge } from './ui.jsx';

const SEEN_KEY = 'yugam.selectedCelebrated';

/**
 * The single celebratory beat in the product, and the only place gold is
 * allowed to move: a 600ms sweep across the honour badge, fired once per
 * application, ever. Reaching "Selected" is the one event that earns it.
 */
export const SelectedMoment = ({ applicationId, jobTitle }) => {
  const reduceMotion = useReducedMotion();
  const fired = useRef(false);

  const seen = (() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    } catch {
      return [];
    }
  })();

  const alreadyCelebrated = seen.includes(applicationId);

  useEffect(() => {
    if (alreadyCelebrated || fired.current || reduceMotion) return;
    fired.current = true;

    confetti({
      particleCount: 48,
      spread: 62,
      startVelocity: 28,
      gravity: 0.9,
      ticks: 140,
      scalar: 0.85,
      origin: { y: 0.32 },
      colors: ['#C8A227', '#6D28D9'],
      disableForReducedMotion: true,
    });

    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, applicationId]));
    } catch {
      // A blocked localStorage only means the beat may replay — harmless.
    }
  }, [alreadyCelebrated, applicationId, reduceMotion, seen]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-gold-500/40 bg-gold-50/60 p-4">
      <MeritBadge sweep={!alreadyCelebrated && !reduceMotion}>Selected</MeritBadge>
      <p className="min-w-0 flex-1 text-ui text-ink">
        You have been selected for <span className="font-semibold">{jobTitle}</span>. The
        school will be in touch with the next steps.
      </p>
    </div>
  );
};
