/**
 * The school's name and promise, shown at the foot of every page. Kept in one
 * place so the wording only ever has to change here.
 *
 * It is centred and sized up rather than set as small print in a corner: it is
 * the only thing in the footer, so it carries the whole band.
 *
 * `onDark` is for the deep-purple public footer, where gold type is legal;
 * the default is the light card surface used behind the signed-in layouts.
 */
export const FOOTER_TAGLINE =
  'Connecting Great Schools with Great Educators — Together, Shaping the Future of Education.';

export const FooterTagline = ({ onDark = false }) => (
  <div className="text-center">
    <p
      className={
        onDark
          ? 'font-serif text-heading font-semibold tracking-tight text-gold-500'
          : 'font-serif text-heading font-semibold tracking-tight text-ink'
      }
    >
      Yugam International School
    </p>
    <p
      className={
        onDark
          ? 'mx-auto mt-1.5 max-w-[52ch] text-ui font-semibold italic leading-snug text-white/85'
          : 'mx-auto mt-1.5 max-w-[52ch] text-ui font-semibold italic leading-snug text-ink-soft'
      }
    >
      “{FOOTER_TAGLINE}”
    </p>
  </div>
);

/**
 * The same promise as a single quiet line, for the signed-in shells. People
 * spend hours there; the full band would be a wall at the foot of every list.
 */
export const FooterTaglineCompact = ({ children }) => (
  <div className="flex flex-col items-center gap-1 text-center text-meta text-ink-soft sm:flex-row sm:justify-between sm:text-left">
    <p className="min-w-0">
      <span className="font-serif font-semibold text-ink">Yugam International School</span>
      <span className="mx-2 hidden text-line sm:inline" aria-hidden="true">|</span>
      <span className="block italic sm:inline">“{FOOTER_TAGLINE}”</span>
    </p>
    {children ? <p className="shrink-0">{children}</p> : null}
  </div>
);
