import { Check } from 'lucide-react';
import { Card } from '../../components/ui.jsx';

/**
 * Sign-in and sign-up share one frame: on a desktop a deep purple panel with
 * a few plain reassurances sits beside the form; on a phone the panel drops
 * away and the form comes first, so nothing stands between a teacher and the
 * fields.
 */
export const AuthShell = ({ title, description, panelTitle, points, children, footer }) => (
  <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
    <Card className="grid overflow-hidden md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Gold type is legal here — it sits on plum-900. */}
      <aside className="hidden flex-col justify-between bg-plum-900 p-8 md:flex lg:p-10">
        <div>
          <p className="max-w-[16ch] font-serif text-title font-semibold text-gold-500">
            {panelTitle}
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-ui leading-relaxed text-white/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-500/50">
                  <Check className="h-3 w-3 text-gold-500" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-meta text-white/60">Yugam International School · Job Portal</p>
      </aside>

      <div className="bg-card px-5 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto max-w-sm">
          <h1 className="font-serif text-title font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-ui text-ink-soft">{description}</p>
          <div className="mt-7">{children}</div>
          {footer ? (
            <p className="mt-6 border-t border-line pt-5 text-center text-ui text-ink-soft">{footer}</p>
          ) : null}
        </div>
      </div>
    </Card>
  </div>
);
