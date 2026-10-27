import { clsx } from '../../lib/clsx.js';
import { useQuery } from '@tanstack/react-query';
import { FileText, Briefcase, Upload, ArrowRight, CalendarClock, Video, MapPinned, BookOpen } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  ButtonLink,
  SectionHeader,
  TextLink,
  List,
  ListRow,
} from '../../components/ui.jsx';
import { CardSkeleton, Skeleton } from '../../components/Loading.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { JobCard } from '../../components/JobCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime, formatRelative } from '../../lib/format.js';

export const CandidateDashboard = () => {
  const { user } = useAuth();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request(endpoints.profile.get),
  });

  const applicationFilters = { page: 1, limit: 3 };
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['my-applications', applicationFilters],
    queryFn: () => request(endpoints.applications.myList, applicationFilters),
  });

  const jobFilters = { page: 1, limit: 4 };
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', jobFilters],
    queryFn: () => request(endpoints.jobs.list, jobFilters),
    staleTime: 60000,
  });

  const profile = profileData?.profile;
  const applications = applicationsData?.items ?? [];
  const jobs = jobsData?.items ?? [];

  const needsCv = profile && !profile.cv?.storagePath;
  const needsCompletion = profile && profile.profileCompletion < 60;

  const upcomingInterview = applications.find(
    (application) => application.interview && new Date(application.interview.scheduledAt) >= new Date(),
  );

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Your applications and openings that may suit you."
      />

      {/* The single most important next action gets the top slot. */}
      {profileLoading ? (
        <Skeleton className="mb-8 h-24 w-full rounded-card" />
      ) : needsCv ? (
        <NextStep
          icon={Upload}
          title="Upload your CV to get started"
          description="We will fill in your profile automatically so you can apply in one click."
          action={
            <ButtonLink to="/profile/upload-cv" className="w-full sm:w-auto">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload CV
            </ButtonLink>
          }
        />
      ) : needsCompletion ? (
        <NextStep
          title={`Your profile is ${profile.profileCompletion}% complete`}
          description="Complete it to at least 60% to start applying."
          progress={profile.profileCompletion}
          tone="gold"
          action={
            <ButtonLink to="/profile" className="w-full sm:w-auto">
              Complete profile
            </ButtonLink>
          }
        />
      ) : null}

      {upcomingInterview ? (
        <NextStep
          icon={CalendarClock}
          eyebrow="Your next step"
          title={`Interview for ${upcomingInterview.jobId?.title ?? 'your application'}`}
          description={
            <>
              <span className="block font-semibold text-ink">
                {formatDateTime(upcomingInterview.interview.scheduledAt)}
              </span>
              <span className="mt-1 flex items-start gap-1.5">
                {upcomingInterview.interview.mode === 'online' ? (
                  <Video className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <MapPinned className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 break-words">
                  {upcomingInterview.interview.mode === 'online' ? 'Online: ' : 'Venue: '}
                  {upcomingInterview.interview.locationOrLink}
                </span>
              </span>
            </>
          }
          action={
            <ButtonLink to="/applications" variant="secondary" className="w-full sm:w-auto">
              View details
            </ButtonLink>
          }
        />
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
        <div className="space-y-10">
          <section aria-labelledby="recent-applications">
            <SectionHeader
              title={<span id="recent-applications">Recent applications</span>}
              action={<TextLink to="/applications">View all</TextLink>}
            />

            {applicationsLoading ? (
              <CardSkeleton />
            ) : applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Browse the current openings and apply in one click."
                action={
                  <ButtonLink to="/jobs" size="sm">
                    Browse jobs
                  </ButtonLink>
                }
              />
            ) : (
              <List>
                {applications.map((application) => (
                  <ListRow key={application._id} to="/applications">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-ui font-semibold text-ink">
                          {application.jobId?.title ?? 'Job no longer listed'}
                        </h3>
                        <p className="mt-0.5 text-meta text-ink-soft">
                          Applied {formatRelative(application.appliedAt)}
                        </p>
                      </div>
                      <StatusBadge status={application.status} className="shrink-0" />
                    </div>
                  </ListRow>
                ))}
              </List>
            )}
          </section>

          {profile?.subjects?.length > 0 ? (
            <section aria-labelledby="your-subjects">
              <SectionHeader
                title={<span id="your-subjects">Your subjects</span>}
                description="Openings are matched to these."
                action={<TextLink to="/profile">Edit</TextLink>}
              />
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap gap-1.5">
                  {profile.subjects.map((subject) => (
                    <Badge key={subject} className="bg-plum-50 text-plum-800">
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      {subject}
                    </Badge>
                  ))}
                </div>
              </Card>
            </section>
          ) : null}
        </div>

        <section aria-labelledby="openings-for-you">
          <SectionHeader
            title={<span id="openings-for-you">Openings for you</span>}
            action={<TextLink to="/jobs">See all</TextLink>}
          />

          {jobsLoading ? (
            <CardSkeleton />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No openings right now"
              description="We will notify you when a new role is posted."
            />
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 2).map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  hasApplied={jobsData?.appliedJobIds?.includes(job._id)}
                />
              ))}
              <TextLink
                to="/jobs"
                className="group flex items-center justify-center gap-1.5 rounded-card border border-dashed border-line py-3.5 hover:border-plum-300 hover:bg-plum-50/40 hover:no-underline"
              >
                See all openings
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-base ease-out-soft group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </TextLink>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/**
 * The one thing the teacher should do next. A plum-tinted band with the
 * action on the right on desktop and full-width beneath on a phone, so the
 * button is always under the thumb.
 */
const NextStep = ({ icon: Icon, eyebrow, title, description, action, progress, tone = 'plum' }) => (
  // The profile-completion prompt keeps its original gold band.
  <Card
    className={clsx(
      'mb-8 p-5 sm:p-6',
      tone === 'gold' ? 'border-gold-500/40 bg-gold-50' : 'border-plum-200 bg-plum-50',
    )}
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 gap-3.5">
        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-plum-600 ring-1 ring-plum-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-meta font-semibold text-plum-700">{eyebrow}</p> : null}
          <h2
            className={clsx(
              'font-serif text-heading font-semibold',
              tone === 'gold' ? 'text-gold-700' : 'text-plum-900',
            )}
          >
            {title}
          </h2>
          <div className={clsx('mt-1 text-ui', tone === 'gold' ? 'text-gold-700' : 'text-ink-soft')}>
            {description}
          </div>
          {typeof progress === 'number' ? (
            <div
              className={clsx(
                'mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-card ring-1',
                tone === 'gold' ? 'ring-gold-500/40' : 'ring-plum-200',
              )}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            >
              <div
                className="h-full rounded-full bg-plum-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  </Card>
);
