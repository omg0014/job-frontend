import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui.jsx';
import { Spinner } from './Loading.jsx';
import { clsx } from '../lib/clsx.js';

/**
 * The modal shell every dialog in the staff area shares: a dimmed backdrop,
 * a panel that settles in over one base beat, Escape to close, and focus moved
 * into the panel on open and handed back to the trigger on close.
 *
 * On a phone the panel rises from the bottom edge as a sheet, where the thumb
 * already is; from `sm` up it sits centred.
 *
 * The backdrop does not close a dialog: several of these hold a half-filled
 * form, and a stray tap outside should not throw that away.
 *
 * Rendered into document.body so no transformed ancestor (the route's
 * settle-in wrapper, for one) can become the containing block of `fixed`.
 */
export const Dialog = ({ onClose, labelledBy, busy = false, size = 'md', children }) => {
  const panelRef = useRef(null);
  const reduceMotion = useReducedMotion();
  // Parents pass inline callbacks; reading them through a ref keeps the
  // mount effect below from re-running (and re-moving focus) on every render.
  const latest = useRef({ onClose, busy });
  latest.current = { onClose, busy };

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    (panel?.querySelector('[data-autofocus]') ?? panel)?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !latest.current.busy) latest.current.onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-plum-900/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        className={clsx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-field shadow-modal outline-none',
          'rounded-t-card sm:max-h-[88vh] sm:rounded-card',
          size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md',
        )}
      >
        {children}
      </motion.div>
    </div>,
    document.body,
  );
};

export const DialogHeader = ({ id, title, description, onClose, closeDisabled = false }) => (
  <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
    <div className="min-w-0">
      <h2 id={id} className="font-serif text-heading font-semibold text-ink">
        {title}
      </h2>
      {description ? <p className="mt-0.5 text-ui text-ink-soft">{description}</p> : null}
    </div>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close"
        className="-mr-2 -mt-0.5 shrink-0 rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-plum-50 hover:text-ink disabled:opacity-50"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    ) : null}
  </div>
);

export const DialogBody = ({ className = '', children }) => (
  <div className={clsx('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6', className)}>
    {children}
  </div>
);

/** Actions: stacked full-width on a phone (primary on top), right-aligned from `sm`. */
export const DialogFooter = ({ children }) => (
  <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-card px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-3.5 [&>*]:w-full sm:[&>*]:w-auto">
    {children}
  </div>
);

/**
 * Confirmation for a destructive or irreversible action. Used before deleting a
 * job and before rejecting a candidate.
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <Dialog onClose={onCancel} labelledBy="confirm-title" busy={loading} size="sm">
      <div className="flex gap-4 px-5 py-6 sm:px-6">
        {destructive ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-rejected">
            <AlertTriangle className="h-5 w-5 text-status-rejected-ink" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 id="confirm-title" className="font-serif text-heading font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-1.5 text-ui leading-relaxed text-ink-soft">{message}</p>
        </div>
      </div>

      <DialogFooter>
        {/* Focus lands on the safe choice, so Enter never confirms by accident. */}
        <Button variant="secondary" onClick={onCancel} disabled={loading} data-autofocus>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner /> : null}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
