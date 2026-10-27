import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clsx } from '../lib/clsx.js';

/**
 * Raised surfaces: the white `field` tone on the warm paper page, a hairline
 * border and a whisper of shadow. Brighter than a flat card, still quiet.
 *
 * `interactive` is for a card that is itself a link or opens something: it
 * lifts 2px and its shadow deepens on hover, and the border warms to plum.
 */
export const surfaceClass = 'rounded-card border border-line/80 bg-field shadow-card';

export const interactiveSurfaceClass =
  'transition-[border-color,box-shadow,transform] duration-base ease-out-soft hover:-translate-y-0.5 hover:border-plum-200 hover:shadow-card-hover motion-reduce:hover:translate-y-0';

export const Card = ({ className = '', interactive = false, children, ...props }) => (
  <div
    className={clsx(surfaceClass, interactive && interactiveSurfaceClass, className)}
    {...props}
  >
    {children}
  </div>
);

export const Badge = ({ className = '', children }) => (
  <span
    className={clsx(
      // Pill radius on badges — radius varies by element type.
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-meta font-semibold',
      className,
    )}
  >
    {children}
  </span>
);

const BUTTON_VARIANTS = {
  // Purple carries every functional action. Gold never fills a button.
  // Primary lifts a pixel into a soft plum halo on hover, and settles on press.
  primary:
    'bg-plum-600 text-white shadow-sm hover:-translate-y-px hover:bg-plum-700 hover:shadow-glow active:translate-y-0 active:bg-plum-800 active:shadow-none disabled:translate-y-0 disabled:bg-plum-300 disabled:shadow-none',
  secondary:
    'bg-field text-ink border border-line shadow-card hover:border-plum-200 hover:bg-plum-50 hover:text-plum-800 disabled:text-ink-soft disabled:hover:bg-field disabled:hover:border-line',
  ghost: 'text-ink-soft hover:bg-plum-50 hover:text-plum-800 disabled:hover:bg-transparent',
  danger: 'bg-status-rejected-ink text-white hover:brightness-110',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-meta',
  md: 'h-9 px-4 text-ui',
  // Candidate-side targets are large and thumb-reachable.
  lg: 'h-11 px-6 text-body',
  // Square, for icon-only buttons — always pair with an aria-label.
  icon: 'h-9 w-9 text-ui',
  'icon-sm': 'h-8 w-8 text-meta',
};

/** Shared so a router Link can look exactly like a button without nesting one. */
export const buttonClass = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  clsx(
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold',
    // Colour, lift and halo on hover, a 2% press on click — the micro beat.
    'transition-[background-color,border-color,color,transform,box-shadow,filter] duration-base ease-out-soft',
    'motion-reduce:hover:translate-y-0',
    'active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:active:scale-100',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) => (
  <button type={type} className={buttonClass({ variant, size, className })} {...props}>
    {children}
  </button>
);

/** A router link styled as a button — one focusable element, not a button inside a link. */
export const ButtonLink = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => (
  <Link className={buttonClass({ variant, size, className })} {...props}>
    {children}
  </Link>
);

/** The quiet "Back to …" link that sits above a page title. */
export const BackLink = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={clsx(
      'group -ml-1 inline-flex items-center gap-1.5 rounded-control px-1.5 py-1 text-ui font-semibold text-ink-soft',
      'transition-colors duration-micro hover:text-plum-700',
      className,
    )}
  >
    <ArrowLeft
      className="h-4 w-4 transition-transform duration-base ease-out-soft group-hover:-translate-x-0.5"
      aria-hidden="true"
    />
    {children}
  </Link>
);

/**
 * Page title with the honour-board rule beneath it. Used on every page, on both
 * sides of the product — it is the shared structural device.
 */
export const PageHeader = ({ title, description, actions, back, meta, dense = false }) => (
  <header className={clsx('rule-gold', dense ? 'mb-6 pb-4' : 'mb-8 pb-5')}>
    {back ? <div className="mb-3">{back}</div> : null}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1
          className={clsx(
            'font-serif font-semibold text-ink',
            dense ? 'text-title' : 'text-title sm:text-display',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-measure text-ui text-ink-soft sm:text-body">{description}</p>
        ) : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  </header>
);

/**
 * A heading for a block inside a page: serif title on the left, an optional
 * quiet action on the right. Replaces the ad-hoc flex rows each page had.
 */
export const SectionHeader = ({ title, description, action, as: Tag = 'h2', className = '' }) => (
  <div className={clsx('mb-3 flex items-end justify-between gap-4', className)}>
    <div className="min-w-0">
      <Tag className="font-serif text-heading font-semibold text-ink">{title}</Tag>
      {description ? <p className="mt-0.5 text-meta text-ink-soft">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

/** The inline text link used for "View all", "See all roles" and the like. */
export const TextLink = ({ className = '', children, ...props }) => (
  <Link
    className={clsx('link-sweep rounded-control text-ui font-semibold text-plum-600 hover:text-plum-800', className)}
    {...props}
  >
    {children}
  </Link>
);

/**
 * One card, many rows, hairline dividers between them — the spec prefers this
 * to a stack of separately bordered cards.
 */
export const List = ({ className = '', children, as: Tag = 'ul', ...props }) => (
  <Tag
    className={clsx('divide-y divide-line overflow-hidden', surfaceClass, className)}
    {...props}
  >
    {children}
  </Tag>
);

/** A row in a List. Pass `to` to make the whole row a link with a hover tint. */
export const ListRow = ({ to, className = '', children, ...props }) =>
  to ? (
    <li>
      <Link
        to={to}
        className={clsx(
          // A plum edge slides in on the left as the row tints — the row
          // answers the pointer without moving.
          'relative block px-4 py-3.5 transition-colors duration-base hover:bg-plum-50/60 focus-visible:bg-plum-50/60 sm:px-5',
          'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:origin-center before:scale-y-0 before:rounded-full before:bg-plum-600 before:transition-transform before:duration-base before:ease-out-soft hover:before:scale-y-100',
          className,
        )}
        {...props}
      >
        {children}
      </Link>
    </li>
  ) : (
    <li className={clsx('px-4 py-3.5 sm:px-5', className)} {...props}>
      {children}
    </li>
  );

/**
 * A counted figure with its label. The number is the scannable thing; the
 * icon sits quietly beside the label rather than in a boxed tile of its own.
 */
export const StatTile = ({ icon: Icon, label, value, to, hint }) => {
  const body = (
    <>
      <p className="flex items-center gap-2 text-meta font-medium text-ink-soft">
        {Icon ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-plum-50 text-plum-600 transition-colors duration-base group-hover:bg-plum-100">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ) : null}
        {label}
      </p>
      <p data-stat className="mt-2 text-display text-ink">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-meta text-ink-soft">{hint}</p> : null}
    </>
  );

  const base = clsx('group block px-4 py-4 sm:px-5', surfaceClass);
  return to ? (
    <Link to={to} className={clsx(base, interactiveSurfaceClass)}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};

/**
 * The filter bar above a list. Fields sit in a row on desktop and stack on a
 * phone; it is a quiet band, not another card competing with the results.
 */
export const Toolbar = ({ className = '', children }) => (
  <div
    className={clsx(
      'mb-5 grid gap-3 p-3 sm:p-4',
      surfaceClass,
      className,
    )}
  >
    {children}
  </div>
);

/** Empty states give direction, not mood — always with the action right there. */
export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center rounded-card border border-dashed border-plum-200 bg-field/70 px-6 py-12 text-center sm:py-14',
      className,
    )}
  >
    {Icon ? (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-plum-50 ring-8 ring-plum-50/40">
        <Icon className="h-5 w-5 text-plum-600" aria-hidden="true" />
      </div>
    ) : null}
    <h3 className="font-serif text-heading font-semibold text-ink">{title}</h3>
    {description ? (
      <p className="mt-1.5 max-w-sm text-ui leading-relaxed text-ink-soft">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

/** Errors say what broke and how to fix it. */
export const ErrorState = ({ message, onRetry }) => (
  <div
    role="alert"
    className="rounded-card border border-status-rejected bg-status-rejected/40 px-4 py-6 text-center"
  >
    <p className="text-ui font-semibold text-status-rejected-ink">{message}</p>
    {onRetry ? (
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);

export const Pagination = ({ page, totalPages, onChange, total }) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
      aria-label="Pagination"
    >
      <p className="tabular text-ui text-ink-soft">
        Page {page} of {totalPages}
        {typeof total === 'number' ? ` · ${total} result${total === 1 ? '' : 's'}` : ''}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
};

/**
 * The merit marker. This is the one place gold is prominent, and the only
 * gold that ever moves (a single 600ms sweep, fired once).
 */
export const MeritBadge = ({ children, sweep = false, className = '' }) => (
  <span
    className={clsx(
      'relative inline-flex items-center gap-1.5 overflow-hidden rounded-full',
      'border border-gold-500/50 bg-gold-50 px-2.5 py-0.5',
      'text-meta font-semibold text-gold-700',
      className,
    )}
  >
    {sweep ? (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-8 w-8 animate-merit-sweep bg-gradient-to-r from-transparent via-gold-500/35 to-transparent motion-reduce:hidden"
      />
    ) : null}
    {children}
  </span>
);
