import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { clsx } from '../lib/clsx.js';

/** Two letters from a name, for the account button. */
export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

/**
 * The navigation item style shared by the staff rail and both drawers. The
 * active item carries a gold left indicator and a plum-50 tint.
 */
export const navItemClass = ({ isActive }) =>
  clsx(
    'relative flex items-center gap-3 rounded-control px-3 py-2 text-ui font-semibold',
    'transition-colors duration-micro',
    isActive
      ? 'bg-plum-50 text-plum-800 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-gold-500'
      : 'text-ink-soft hover:bg-plum-50/60 hover:text-ink',
  );

/**
 * A navigation item for the staff rail and both drawers. The active item's
 * plum pill (with its gold edge) is one shared element that glides to the new
 * item on navigation; other items warm under the pointer and their icon
 * nudges right. `index` staggers the entrance when a drawer opens.
 */
export const RailNavLink = ({ to, end, icon: Icon, onClick, group = 'rail', index, children }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    style={index === undefined ? undefined : { animationDelay: `${90 + index * 35}ms` }}
    className={({ isActive }) =>
      clsx(
        'group relative isolate flex items-center gap-3 rounded-control px-3 py-2 text-ui font-semibold transition-colors duration-base',
        isActive ? 'text-plum-800' : 'text-ink-soft hover:text-ink',
        index !== undefined && 'animate-rise-in',
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? (
          <motion.span
            layoutId={`${group}-pill`}
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-control bg-plum-50"
            transition={{ type: 'spring', stiffness: 520, damping: 42 }}
          >
            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gold-500" />
          </motion.span>
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-control bg-plum-50/0 transition-colors duration-base group-hover:bg-plum-50/70"
          />
        )}
        {Icon ? (
          <Icon
            className={clsx(
              'h-[18px] w-[18px] shrink-0 transition-[transform,color] duration-base ease-out-soft',
              isActive ? 'text-plum-600' : 'group-hover:translate-x-0.5 group-hover:text-plum-600',
            )}
            aria-hidden="true"
          />
        ) : null}
        {children}
      </>
    )}
  </NavLink>
);

/**
 * The slide-in menu used on narrow screens by both signed-in layouts.
 * Escape closes it, focus moves to the close button on open, and the page
 * behind is held still while it is open.
 */
export const NavDrawer = ({ open, onClose, title, subtitle, children, onSignOut }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-plum-900/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[20rem] flex-col bg-field shadow-modal"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-900 text-ui font-semibold text-gold-500"
                >
                  {initialsOf(title)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-ui font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 truncate text-meta text-ink-soft">{subtitle}</p>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="-mr-1 shrink-0 rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-plum-50 hover:text-ink"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{children}</div>

            <div className="shrink-0 border-t border-line p-3">
              <SignOutButton onClick={onSignOut} />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export const SignOutButton = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'flex w-full items-center gap-3 rounded-control px-3 py-2 text-ui font-semibold text-ink-soft',
      'transition-colors duration-micro hover:bg-status-rejected hover:text-status-rejected-ink',
      className,
    )}
  >
    <LogOut className="h-4 w-4" aria-hidden="true" />
    Sign out
  </button>
);

/**
 * The account button on the plum bar at desktop widths: initials in a gold
 * ring, opening a small menu with who is signed in and the way out.
 */
export const AccountMenu = ({ name, detail, onSignOut, children }) => (
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>
      <button
        type="button"
        aria-label={`Account menu for ${name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-plum-800 text-meta font-semibold text-gold-500 ring-1 ring-gold-500/40 ring-offset-2 ring-offset-plum-900 transition-[box-shadow,background-color,transform] duration-base ease-out-soft hover:scale-105 hover:bg-plum-700 hover:ring-gold-500/80 active:scale-95 data-[state=open]:ring-gold-500 motion-reduce:hover:scale-100"
      >
        {initialsOf(name)}
      </button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        className="z-50 w-64 origin-top-right overflow-hidden rounded-card border border-line bg-field shadow-pop data-[state=open]:animate-rise-in"
      >
        <div className="border-b border-line px-4 py-3">
          <p className="truncate text-ui font-semibold text-ink">{name}</p>
          <p className="mt-0.5 truncate text-meta text-ink-soft">{detail}</p>
        </div>
        {children ? <div className="border-b border-line p-1.5">{children}</div> : null}
        <div className="p-1.5">
          <DropdownMenu.Item asChild onSelect={onSignOut}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-ui font-semibold text-ink-soft outline-none transition-colors duration-micro data-[highlighted]:bg-status-rejected data-[highlighted]:text-status-rejected-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenu.Item>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

/** A link item inside AccountMenu. */
export const AccountMenuLink = ({ as: Component, icon: Icon, children, ...props }) => (
  <DropdownMenu.Item asChild>
    <Component
      className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-ui font-semibold text-ink-soft outline-none transition-colors duration-micro data-[highlighted]:bg-plum-50 data-[highlighted]:text-plum-800"
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </Component>
  </DropdownMenu.Item>
);
