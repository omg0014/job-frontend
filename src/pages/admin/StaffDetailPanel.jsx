import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, Briefcase, Users, CalendarClock, LogIn } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Badge, ErrorState } from '../../components/ui.jsx';
import { Skeleton, TableSkeleton } from '../../components/Loading.jsx';
import { initialsOf } from '../../components/NavDrawer.jsx';
import { ActivityFeed } from '../../components/ActivityFeed.jsx';
import { JobStatusBadge } from '../../components/StatusBadge.jsx';
import { ROLES, ROLE_LABELS, ROLE_BADGES } from '../../lib/roles.js';
import { formatDate, formatRelative } from '../../lib/format.js';

/**
 * One cell of the summary strip. Four share a single bordered band; the 1px
 * gaps over a line-coloured ground draw the dividers at any column count.
 */
const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col-reverse justify-end bg-card px-4 py-3">
    <dt className="mt-1 flex items-center gap-1.5 text-meta text-ink-soft">
      {Icon ? <Icon className="h-3.5 w-3.5 text-plum-500" aria-hidden="true" /> : null}
      {label}
    </dt>
    <dd data-stat className="text-title leading-none text-ink">{value}</dd>
  </div>
);

const PanelSection = ({ title, children }) => (
  <section className="mt-7 first:mt-0">
    <h3 className="mb-3 font-serif text-ui font-semibold text-ink">{title}</h3>
    {children}
  </section>
);

/**
 * One staff member in full: counters, their jobs, their activity — and for a
 * principal, the recruiters beneath them with their own numbers. This is the
 * "admin opens a principal and sees the recruiters inside" view.
 */
export const StaffDetailPanel = ({ staffId, onClose }) => {
  const closeRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: () => request(endpoints.team.get, { userId: staffId }),
  });

  useEffect(() => {
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
  }, [onClose]);

  const staff = data?.staff;
  const activity = staff?.activity;

  // Portalled to body so a transformed ancestor cannot trap the fixed drawer.
  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-plum-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={staff ? `${staff.name}: activity` : 'Staff activity'}
        initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
        animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 380, damping: 38 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-field shadow-modal sm:max-w-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3.5">
            {isLoading ? (
              <>
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              </>
            ) : staff ? (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-plum-900 text-ui font-semibold text-gold-500"
                >
                  {initialsOf(staff.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="font-serif text-heading font-semibold text-ink">{staff.name}</h2>
                    <Badge className={ROLE_BADGES[staff.role]}>{ROLE_LABELS[staff.role]}</Badge>
                    {!staff.isActive ? (
                      <Badge className="bg-status-rejected text-status-rejected-ink">Suspended</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-ui text-ink-soft">
                    {staff.email}
                    {staff.department ? ` · ${staff.department}` : ''}
                  </p>
                  {data.appointedByUser ? (
                    <p className="mt-0.5 text-meta text-ink-soft">
                      Appointed by {data.appointedByUser.name} ({data.appointedByUser.roleLabel})
                      {staff.appointedAt ? ` on ${formatDate(staff.appointedAt)}` : ''}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 shrink-0 rounded-control p-2 text-ink-soft transition-colors duration-micro hover:bg-plum-50 hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : isError ? (
            <ErrorState message={error.message} onRetry={refetch} />
          ) : (
            <>
              <PanelSection title="Activity summary">
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
                  <Stat icon={Briefcase} label="Jobs posted" value={activity?.jobsPosted ?? 0} />
                  <Stat icon={Users} label="Applicants moved" value={activity?.applicationsReviewed ?? 0} />
                  <Stat icon={CalendarClock} label="Interviews" value={activity?.interviewsScheduled ?? 0} />
                  <Stat icon={LogIn} label="Sign-ins" value={activity?.logins ?? 0} />
                </dl>
                <p className="mt-2 text-meta text-ink-soft">
                  {staff.lastLoginAt
                    ? `Last signed in ${formatRelative(staff.lastLoginAt)}`
                    : 'Has not signed in yet'}
                </p>
              </PanelSection>

              {/* Nested recruiters — only a principal has these. */}
              {data.reports?.length > 0 ? (
                <PanelSection title={`Recruiters appointed by ${staff.name} (${data.reports.length})`}>
                  <ul className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
                    {data.reports.map((report) => (
                      <li key={report.id} className="px-4 py-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-ui font-semibold text-ink">{report.name}</p>
                              <Badge className={ROLE_BADGES[report.role]}>
                                {ROLE_LABELS[report.role]}
                              </Badge>
                              {!report.isActive ? (
                                <Badge className="bg-status-rejected text-status-rejected-ink">
                                  Suspended
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate text-meta text-ink-soft">
                              {report.email}
                              {report.department ? ` · ${report.department}` : ''}
                            </p>
                          </div>
                          <p className="text-meta text-ink-soft">
                            {report.lastLoginAt
                              ? `Signed in ${formatRelative(report.lastLoginAt)}`
                              : 'Never signed in'}
                          </p>
                        </div>

                        <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-meta text-ink-soft">
                          {[
                            ['Posted', report.activity?.jobsPosted ?? 0],
                            ['Open', report.jobs?.open ?? 0],
                            ['Applicants', report.activity?.applicationsReviewed ?? 0],
                            ['Sign-ins', report.activity?.logins ?? 0],
                          ].map(([label, value]) => (
                            <div key={label} className="flex items-baseline gap-1.5">
                              <dt>{label}</dt>
                              <dd className="tabular font-semibold text-ink">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </PanelSection>
              ) : null}

              {data.jobs?.length > 0 ? (
                <PanelSection title={`Jobs posted (${data.jobs.length} most recent)`}>
                  <ul className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
                    {data.jobs.map((job) => (
                      <li key={job._id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-ui font-semibold text-ink">{job.title}</p>
                          <p className="text-meta text-ink-soft">
                            {job.department} · {job.applicationCount} applicant
                            {job.applicationCount === 1 ? '' : 's'} · posted{' '}
                            {formatRelative(job.createdAt)}
                          </p>
                        </div>
                        <JobStatusBadge status={job.status} />
                      </li>
                    ))}
                  </ul>
                </PanelSection>
              ) : null}

              <PanelSection title="Recent activity">
                <Card className="px-4">
                  <ActivityFeed
                    entries={data.recentActivity ?? []}
                    showActor={false}
                    emptyMessage={`${staff.name} has not done anything yet.`}
                  />
                </Card>
              </PanelSection>
            </>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
};
