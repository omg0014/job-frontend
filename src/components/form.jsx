import { forwardRef, useId, useState, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { clsx } from '../lib/clsx.js';

const baseFieldClass =
  'block w-full rounded-control border bg-field px-3 py-2 text-ui text-ink ' +
  'placeholder:text-ink-soft/60 ' +
  'transition-[border-color,box-shadow,background-color] duration-base ease-out-soft ' +
  'shadow-[inset_0_1px_2px_rgb(36_31_46/0.04)] ' +
  'hover:border-plum-200 ' +
  // A soft plum halo on focus, on top of the border colour change.
  'focus:outline-none focus-visible:border-plum-600 focus-visible:ring-4 focus-visible:ring-plum-600/10 ' +
  'disabled:bg-paper disabled:text-ink-soft disabled:cursor-not-allowed';

/**
 * A field the CV parser filled in. Badging these tells the teacher exactly what
 * to double-check — parsing is a suggestion, never truth.
 */
export const AutoFilledBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/60 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
    from your CV
  </span>
);

export const Field = ({ label, error, hint, required, autoFilled, htmlFor, children }) => (
  <div>
    <div className="mb-1.5 flex items-center gap-2">
      <label htmlFor={htmlFor} className="block text-ui font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-status-rejected-ink" aria-hidden="true">*</span>
        ) : null}
      </label>
      {autoFilled ? <AutoFilledBadge /> : null}
    </div>
    {children}
    {error ? (
      <p role="alert" className="mt-1.5 text-meta text-status-rejected-ink">{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-meta text-ink-soft">{hint}</p>
    ) : null}
  </div>
);

export const Input = forwardRef(({ className = '', error, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      baseFieldClass,
      error ? 'border-status-rejected-ink' : 'border-line',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className = '', error, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={clsx(
      baseFieldClass,
      error ? 'border-status-rejected-ink' : 'border-line',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className = '', error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={clsx(
      baseFieldClass,
      error ? 'border-status-rejected-ink' : 'border-line',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export const Checkbox = forwardRef(({ label, className = '', ...props }, ref) => {
  const id = useId();
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        // No forms plugin here, so the native control is tinted with accent-color.
        className="h-4 w-4 shrink-0 cursor-pointer accent-plum-600"
        {...props}
      />
      <label htmlFor={id} className="cursor-pointer text-ui text-ink">
        {label}
      </label>
    </div>
  );
});
Checkbox.displayName = 'Checkbox';

/**
 * Removable chips with autocomplete from a seeded vocabulary. Used for
 * subjects, skills, certifications and languages.
 */
export const ChipInput = ({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter',
  disabled = false,
}) => {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const available = suggestions.filter(
    (item) =>
      !value.includes(item) &&
      (draft.length === 0 || item.toLowerCase().includes(draft.toLowerCase())),
  );

  const add = (item) => {
    const trimmed = item.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...value, trimmed]);
    setDraft('');
    inputRef.current?.focus();
  };

  const remove = (item) => onChange(value.filter((entry) => entry !== item));

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
      return;
    }
    // Backspace on an empty box removes the last chip.
    if (event.key === 'Backspace' && draft.length === 0 && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div
        className={clsx(
          'flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-control px-2 py-1.5',
          'border border-line bg-field transition-[border-color,box-shadow] duration-base hover:border-plum-200',
          'focus-within:border-plum-600 focus-within:ring-4 focus-within:ring-plum-600/10',
          disabled && 'bg-paper',
        )}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-control bg-plum-50 py-0.5 pl-2 pr-1 text-meta font-semibold text-plum-800"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(item)}
              disabled={disabled}
              className="rounded p-0.5 text-plum-500 hover:bg-plum-100 hover:text-plum-800"
              aria-label={`Remove ${item}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          // Delayed so a click on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0.5 text-ui text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-0"
        />
      </div>

      {open && available.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-control border border-line bg-field py-1 shadow-pop">
          {available.slice(0, 8).map((item) => (
            <li key={item}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(item)}
                className="block w-full px-3 py-1.5 text-left text-ui text-ink hover:bg-plum-50 hover:text-plum-800"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

/**
 * Flattens react-hook-form's nested error tree into a list of
 * { name, message } with dotted paths ("education.0.yearOfPassing") — the
 * same shape the API returns in `details.errors`, so both sources of a
 * validation failure can be shown and navigated the same way.
 */
export const flattenErrors = (errors, prefix = '') => {
  const out = [];
  if (!errors || typeof errors !== 'object') return out;

  // A leaf: RHF errors carry a string message (and a type).
  if (typeof errors.message === 'string' && errors.message) {
    out.push({ name: prefix, message: errors.message });
  }

  Object.keys(errors).forEach((key) => {
    // `ref` is the DOM node RHF attaches, `root` holds array-level errors.
    if (key === 'message' || key === 'type' || key === 'ref' || key === 'types') return;
    const child = errors[key];
    if (!child || typeof child !== 'object') return;
    const path = key === 'root' ? prefix : prefix ? `${prefix}.${key}` : key;
    out.push(...flattenErrors(child, path));
  });

  return out;
};

/** The first message anywhere under an error node — for chip lists and rows. */
export const firstMessage = (error) => flattenErrors(error)[0]?.message;

/**
 * Scrolls a field into view and puts the cursor in it. Looks for the input by
 * its registered name first, then for the nearest wrapper marked with
 * data-field (chip inputs and whole sections have no single named input).
 */
export const focusField = (name) => {
  if (typeof document === 'undefined' || !name) return;

  const escape = (value) => (window.CSS?.escape ? window.CSS.escape(value) : value);
  let target = document.querySelector(`[name="${escape(name)}"]`);

  const parts = name.split('.');
  while (!target && parts.length > 0) {
    target = document.querySelector(`[data-field="${escape(parts.join('.'))}"]`);
    parts.pop();
  }
  if (!target) return;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Centred, so the sticky header never covers the field.
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

  const focusable = target.matches('input, textarea, select, button')
    ? target
    : target.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
  // After the scroll has started, and without a second jump.
  window.setTimeout(() => focusable?.focus({ preventScroll: true }), reduceMotion ? 0 : 350);
};

/**
 * Every problem on the form in one place, each a link to its field. It sits
 * beside the submit button, where the person is looking when saving fails.
 */
export const ErrorSummary = ({ title, items, onSelect }) => {
  if (!items?.length) return null;

  return (
    <div
      role="alert"
      className="fade-in rounded-card border border-status-rejected-ink/30 bg-status-rejected/40 p-4 sm:p-5"
    >
      <p className="flex items-center gap-2 text-ui font-semibold text-status-rejected-ink">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.name || item.label}>
            <button
              type="button"
              onClick={() => onSelect?.(item.name)}
              className="group rounded-control text-left text-ui leading-snug"
            >
              <span className="font-semibold text-ink underline decoration-status-rejected-ink/40 underline-offset-2 transition-colors duration-micro group-hover:decoration-status-rejected-ink">
                {item.label}
              </span>
              <span className="text-ink-soft"> — {item.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
