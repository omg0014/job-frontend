import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users, UserCheck, CalendarClock, Plus } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  ButtonLink,
  PageHeader,
  SectionHeader,
  TextLink,
  List,
  ListRow,
  StatTile,
  EmptyState,
  ErrorState,
} from '../../components/ui.jsx';
import { Skeleton, TableSkeleton } from '../../components/Loading.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatDateTime, formatRelative } from '../../lib/format.js';

/** Interview mode reads as a word, not a code: "offline" → "In person". */
const MODE_LABELS = { offline: 'In person', online: 'Online', phone: 'Phone' };

export const AdminDashboard = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => request(endpoints.admin.dashboard),
    staleTime: 30000,
  });

  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  const counters = data?.counters;
  const upcomingInterviews = data?.upcomingInterviews ?? [];
  const recentApplications = data?.recentApplications ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Hiring at a glance."
        actions={
          <ButtonLink to="/admin/jobs/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Post a job
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key -- static placeholders
              <Skeleton key={index} className="h-[104px] rounded-card" />
            ))
          : [
              { icon: Briefcase, label: 'Active jobs', value: counters.activeJobs, to: '/admin/jobs' },
              {
                icon: Users,
                label: 'Total applicants',
                value: counters.totalApplicants,
                to: '/admin/applicants',
              },
              {
                icon: UserCheck,
                label: 'Shortlisted',
                value: counters.shortlisted,
                to: '/admin/applicants?status=shortlisted',
              },
              {
                icon: CalendarClock,
                label: 'Upcoming interviews',
                value: counters.upcomingInterviews,
                to: '/admin/interviews',
              },
            ].map((counter) => (
              <StatTile
                key={counter.label}
                icon={counter.icon}
                label={counter.label}
                to={counter.to}
                // Digits roll when the count changes, so a static dashboard
                // reads as live without any other motion.
                value={<NumberFlow value={counter.value ?? 0} />}
              />
            ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby="upcoming-interviews" className="min-w-0">
          <SectionHeader
            title={<span id="upcoming-interviews">Upcoming interviews</span>}
            action={<TextLink to="/admin/interviews">View all</TextLink>}
          />

          {isLoading ? (
            <div className="rounded-card border border-line/80 bg-field shadow-card p-4">
              <TableSkeleton rows={3} />
            </div>
          ) : upcomingInterviews.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No interviews scheduled"
              description="Shortlist a candidate to schedule their interview."
            />
          ) : (
            <List>
              {upcomingInterviews.map((interview) => (
                <ListRow
                  key={interview._id}
                  to={`/admin/applications/${interview.applicationId?._id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-ui font-semibold text-ink">
                        {interview.applicationId?.profileSnapshot?.fullName ?? 'Candidate'}
                      </p>
                      <p className="mt-0.5 truncate text-meta text-ink-soft">
                        {interview.applicationId?.jobId?.title ?? 'Role'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-meta font-semibold text-ink">
                        {formatDateTime(interview.scheduledAt)}
                      </p>
                      <p className="mt-0.5 text-meta text-ink-soft">
                        {MODE_LABELS[interview.mode] ?? interview.mode}
                      </p>
                    </div>
                  </div>
                </ListRow>
              ))}
            </List>
          )}
        </section>

        <section aria-labelledby="recent-applications" className="min-w-0">
          <SectionHeader
            title={<span id="recent-applications">Recent applications</span>}
            action={<TextLink to="/admin/applicants">All applicants</TextLink>}
          />

          {isLoading ? (
            <div className="rounded-card border border-line/80 bg-field shadow-card p-4">
              <TableSkeleton rows={4} />
            </div>
          ) : recentApplications.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No applications yet"
              description="Applications will appear here as candidates apply."
            />
          ) : (
            <List>
              {recentApplications.map((application) => (
                <ListRow key={application._id} to={`/admin/applications/${application._id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-ui font-semibold text-ink">
                        {application.profileSnapshot?.fullName ?? 'Candidate'}
                      </p>
                      <p className="mt-0.5 truncate text-meta text-ink-soft">
                        {application.jobId?.title ?? 'Role'} ·{' '}
                        {formatRelative(application.appliedAt)}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                </ListRow>
              ))}
            </List>
          )}
        </section>
      </div>
    </div>
  );
};
