import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from '../lib/clsx.js';

/** True once the page has scrolled past `threshold` pixels. */
export const useScrolled = (threshold = 4) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
};

/**
 * The plum bar shared by every layout. At rest it sits flush with the page;
 * once content scrolls beneath it, it takes a soft plum shadow and a fine gold
 * rule along its foot — the honour-board line, drawn only when it separates
 * something.
 */
export const SiteHeader = ({ children, innerClassName = '' }) => {
  const scrolled = useScrolled();

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 bg-plum-900 transition-shadow duration-panel ease-out-soft',
        scrolled ? 'shadow-header' : 'shadow-none',
      )}
    >
      <div className={clsx('relative flex h-16 items-center justify-between gap-3', innerClassName)}>
        {children}
      </div>
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center bg-gold-500/40 transition-[opacity,transform] duration-panel ease-out-soft',
          scrolled ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0',
        )}
      />
    </header>
  );
};

/**
 * A link on the plum bar. The active page's gold marker is one shared element
 * (layoutId) that glides from the old link to the new one on navigation.
 */
export const BarNavLink = ({ to, end, group = 'bar', children, className = '' }) => (
  <NavLink to={to} end={end} className={clsx('bar-link', className)}>
    {({ isActive }) => (
      <>
        {children}
        {isActive ? (
          <motion.span
            layoutId={`${group}-active`}
            aria-hidden="true"
            className="absolute inset-x-3 -bottom-[14px] h-0.5 rounded-full bg-gold-500"
            transition={{ type: 'spring', stiffness: 520, damping: 42 }}
          />
        ) : null}
      </>
    )}
  </NavLink>
);

/**
 * The hamburger. Its middle line stretches to full width on hover — a small
 * sign of life on the one control a phone user reaches for most.
 */
export const MenuIcon = () => (
  <span aria-hidden="true" className="flex h-5 w-5 flex-col items-end justify-center gap-[4px]">
    <span className="h-[2px] w-5 rounded-full bg-current" />
    <span className="h-[2px] w-3.5 rounded-full bg-current transition-[width] duration-base ease-out-soft group-hover:w-5" />
    <span className="h-[2px] w-5 rounded-full bg-current" />
  </span>
);

/** The phone menu button on the plum bar, with the unread badge. */
export const MenuButton = ({ onClick, expanded, unreadCount = 0, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Open menu"
    aria-expanded={expanded}
    className={clsx(
      'group relative inline-flex items-center gap-2 rounded-control px-2.5 py-2 text-white/80 transition-colors duration-base hover:bg-white/10 hover:text-white',
      className,
    )}
  >
    <MenuIcon />
    <span className="hidden text-ui font-semibold sm:inline">Menu</span>
    {unreadCount > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-plum-900 ring-2 ring-plum-900"
        aria-label={`${unreadCount} unread notifications`}
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    ) : null}
  </button>
);
