import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, IndianRupee, Briefcase, Clock, Users, Check } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { BookmarkButton } from './BookmarkButton.jsx';
import { ApplyForm } from './ApplyForm.jsx';
import { cn } from '../lib/cn.js';
import { panelSpring, backdropFade } from '../lib/motion.js';
import { formatLpa, formatExperience, formatPostedAt, LOGO_TONES } from '../lib/format.js';

/**
 * Detail surface. On desktop it is a right-side panel; below `lg` it becomes a
 * full-height sheet. Both are the same component — only the width and the
 * entry axis differ.
 *
 * Focus is moved into the panel on open and restored to the trigger on close,
 * and Escape closes it, so it behaves like the dialog it visually is.
 */
export const JobDetailPanel = ({ job, saved, onToggleSave, onClose }) => {
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // Reset the apply state when a different job is opened in the same panel.
  useEffect(() => {
    setApplyOpen(false);
    setSubmitted(false);
    panelRef.current?.scrollTo({ top: 0 });
  }, [job?.id]);

  useEffect(() => {
    if (!job) return undefined;

    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Prevent the page behind from scrolling under the sheet.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [job, onClose]);

  return (
    <AnimatePresence>
      {job ? (
        <>
          <motion.div
            variants={backdropFade}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-ink-900/25 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-detail-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={panelSpring}
            className={cn(
              'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface shadow-panel',
              'sm:max-w-[34rem] lg:max-w-[38rem]',
            )}
          >
            {/* Sticky header so the company and the close control stay reachable. */}
            <header className="shrink-0 border-b border-ink-200 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold ring-1',
                    LOGO_TONES[job.logoTone] ?? LOGO_TONES.slate,
                  )}
                  aria-hidden="true"
                >
                  {job.logoText}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="job-detail-title"
                      className="text-lg font-semibold leading-tight tracking-tighter2 text-ink-900"
                    >
                      {job.title}
                    </h2>
                    {job.featured ? (
                      <Badge variant="gold" size="sm">Featured</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink-600">
                    {job.company}
                    <span className="mx-1.5 text-ink-300" aria-hidden="true">·</span>
                    {job.location}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <BookmarkButton saved={saved} onToggle={onToggleSave} jobTitle={job.title} />
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close job details"
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-500',
                      'transition-colors duration-150 ease-out hover:bg-ink-100 hover:text-ink-900',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2',
                    )}
                  >
                    <X className="h-[18px] w-[18px]" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </header>

            <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-card border border-ink-200 bg-canvas p-4">
                {[
                  { icon: IndianRupee, label: 'Salary', value: formatLpa(job.salaryMin, job.salaryMax) },
                  { icon: Briefcase, label: 'Experience', value: formatExperience(job.expMin, job.expMax) },
                  { icon: MapPin, label: 'Work mode', value: `${job.workMode} · ${job.roleType}` },
                  { icon: Clock, label: 'Posted', value: formatPostedAt(job.postedAt) },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wide text-ink-500">{item.label}</dt>
                      <dd className="mt-0.5 text-[13px] font-medium text-ink-900">{item.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex items-center gap-2 text-[13px] text-ink-500">
                <Users className="h-4 w-4 text-ink-400" aria-hidden="true" />
                <span>{job.applicants} people have applied</span>
              </div>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  About the role
                </h3>
                <div className="mt-2.5 space-y-3 text-[14px] leading-[1.7] text-ink-700">
                  {job.description.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  What you will do
                </h3>
                <ul className="mt-2.5 space-y-2">
                  {job.responsibilities.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14px] leading-[1.65] text-ink-700">
                      <span
                        className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-purple-400"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  What we are looking for
                </h3>
                <ul className="mt-2.5 space-y-2">
                  {job.requirements.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14px] leading-[1.65] text-ink-700">
                      <Check
                        className="mt-[3px] h-4 w-4 shrink-0 text-purple-600"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  Tech stack
                </h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="purple">{tag}</Badge>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  Benefits
                </h3>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {job.benefits.map((benefit) => (
                    <li key={benefit}>
                      <Badge variant="outline">{benefit}</Badge>
                    </li>
                  ))}
                </ul>
              </section>

              <AnimatePresence initial={false}>
                {applyOpen ? (
                  <motion.section
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-7 border-t border-ink-200 pt-6">
                      <h3 className="mb-4 text-[15px] font-semibold tracking-heading text-ink-900">
                        Apply to this role
                      </h3>
                      <ApplyForm
                        job={job}
                        submitted={submitted}
                        onSubmitted={() => setSubmitted(true)}
                      />
                    </div>
                  </motion.section>
                ) : null}
              </AnimatePresence>

              <div className="h-4" />
            </div>

            {/* Action bar pinned to the panel, not the page. */}
            {!applyOpen ? (
              <footer className="shrink-0 border-t border-ink-200 bg-surface px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-3">
                  <Button size="lg" className="flex-1" onClick={() => setApplyOpen(true)}>
                    Apply now
                  </Button>
                  <Button variant="secondary" size="lg" onClick={onToggleSave}>
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </footer>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};
