import { clsx } from '../lib/clsx.js';
import emblem from '/yugam-logo.png';

/**
 * The school emblem beside the wordmark.
 *
 * On the deep purple nav the name is gold — this is the pairing's best moment
 * and where the design spec says to spend it. On light surfaces the name falls
 * back to ink, since gold type on white fails contrast.
 *
 * The emblem itself is a transparent PNG, so it needs no treatment on either
 * ground; only the favicon versions are composited onto plum.
 */
export const Logo = ({ className = '', compact = false, onDark = false }) => (
  <span className={clsx('flex items-center gap-2.5', className)}>
    {/* A fixed square box with object-contain, so the emblem is never
        cropped or stretched whatever its own aspect ratio. */}
    <span className="flex h-10 w-10 shrink-0 items-center justify-center">
      <img
        src={emblem}
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        // Tilts a few degrees when the link it sits in (group/logo) is hovered.
        className="max-h-full max-w-full object-contain transition-transform duration-panel ease-out-soft group-hover/logo:-rotate-6 group-hover/logo:scale-105 motion-reduce:transform-none"
        // The emblem paints in the first frame of the nav, so it should not wait.
        loading="eager"
        decoding="sync"
      />
    </span>

    {!compact ? (
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={clsx(
            'whitespace-nowrap font-serif text-ui font-semibold',
            onDark ? 'text-gold-500' : 'text-ink',
          )}
        >
          <span className="hidden sm:inline">Yugam International School</span>
          <span className="sm:hidden">Yugam</span>
        </span>
        <span
          className={clsx(
            'whitespace-nowrap text-[11px]',
            onDark ? 'text-white/60' : 'text-ink-soft',
          )}
        >
          Job Portal
        </span>
      </span>
    ) : null}
  </span>
);
