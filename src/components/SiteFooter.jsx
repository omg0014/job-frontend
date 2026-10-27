import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { FOOTER_TAGLINE } from './FooterTagline.jsx';
import { clsx } from '../lib/clsx.js';

const scrollToTop = () => {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
};

const BackToTop = ({ onDark = false }) => (
  <button
    type="button"
    onClick={scrollToTop}
    className={clsx(
      'group inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-meta font-semibold transition-colors duration-base',
      onDark ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-ink-soft hover:bg-plum-50 hover:text-plum-800',
    )}
  >
    <ArrowUp
      className="h-3.5 w-3.5 transition-transform duration-base ease-out-soft group-hover:-translate-y-0.5"
      aria-hidden="true"
    />
    Back to top
  </button>
);

const FooterLink = ({ to, children, onDark = false }) => (
  <Link
    to={to}
    className={clsx(
      'link-sweep inline-block rounded-control text-ui',
      onDark ? 'text-white/75 hover:text-white' : 'text-ink-soft hover:text-plum-800',
    )}
  >
    {children}
  </Link>
);

/**
 * The public footer: the school and its promise on the left, link columns on
 * the right, and a quiet base line. Deep plum with gold type — where the
 * pairing is spent.
 *
 * `columns` is [{ title, links: [{ to, label }] }].
 */
export const PublicFooter = ({ columns }) => (
  <footer className="relative overflow-hidden bg-plum-900">
    {/* A low plum glow from above, so the band has depth rather than reading
        as a flat block. Palette plum only — no gold gradients. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-3xl rounded-full bg-plum-700/30 blur-3xl"
    />

    <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="col-span-2 max-w-sm md:col-span-1">
          <Link to="/" aria-label="Yugam International School Job Portal, home" className="group/logo inline-block rounded-control">
            <Logo onDark />
          </Link>
          <p className="mt-5 font-serif text-body italic leading-relaxed text-white/85">
            “{FOOTER_TAGLINE}”
          </p>
          <span aria-hidden="true" className="mt-5 block h-px w-12 bg-gold-500/70" />
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-meta font-semibold text-gold-500">{column.title}</h2>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.to}>
                  <FooterLink to={link.to} onDark>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 flex flex-col-reverse items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
        <p className="text-meta text-white/55">
          © {new Date().getFullYear()} Yugam International School · Job Portal
        </p>
        <BackToTop onDark />
      </div>
    </div>
  </footer>
);

/**
 * The signed-in footer: lighter, because people work above it for hours. The
 * school and promise on one side, the account context and quick links on the
 * other.
 */
export const AppFooter = ({ email, links = [], innerClassName = '' }) => (
  <footer className="border-t border-line bg-field/70">
    <div
      className={clsx(
        'flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between',
        innerClassName,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Logo compact />
        <div className="min-w-0">
          <p className="font-serif text-ui font-semibold text-ink">Yugam International School</p>
          <p className="text-meta italic text-ink-soft">“{FOOTER_TAGLINE}”</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        {links.length > 0 ? (
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {email ? <p className="text-meta text-ink-soft">Signed in as {email}</p> : null}
          <BackToTop />
        </div>
      </div>
    </div>
  </footer>
);
