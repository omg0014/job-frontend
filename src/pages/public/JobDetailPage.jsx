import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Briefcase, Calendar, Users, GraduationCap } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, Badge, ErrorState, BackLink } from '../../components/ui.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { ApplyButton } from '../../components/ApplyButton.jsx';
import { ShareJob } from '../../components/ShareJob.jsx';
import { RichText } from '../../components/RichText.jsx';
import { formatDate, formatExperience } from '../../lib/format.js';
import { EMPLOYMENT_TYPE_LABELS } from '../../lib/constants.js';

/** One block of the role — a serif heading over its content, hairline above. */
const Section = ({ title, icon: Icon, children }) => (
  <section className="border-t border-line pt-6">
    <h2 className="flex items-center gap-2 font-serif text-heading font-semibold text-ink">
      {Icon ? <Icon className="h-[18px] w-[18px] text-ink-soft/70" aria-hidden="true" /> : null}
      {title}
    </h2>
    <div className="mt-3">{children}</div>
  </section>
);

export const JobDetailPage = () => {
  // The route keeps a normal shareable path; only the API is POST-only, so the
  // id is read from the URL and sent in the request body.
  const { id } = useParams();

  // The path segment is a slug on shared links and a raw id on older ones, so
  // it is sent under whichever key it looks like. A 24-character hex string is
  // an id; anything else is a slug.
  const isObjectId = /^[a-f0-9]{24}$/i.test(id ?? '');
  const lookup = isObjectId ? { jobId: id } : { slug: id };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => request(endpoints.jobs.get, lookup),
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-6 h-9 w-2/3 max-w-xl" />
        <Skeleton className="mt-3 h-4 w-1/3 max-w-xs" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <Skeleton className="hidden h-64 w-full lg:block" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState message={error.message} onRetry={refetch} />
        <div className="mt-5 text-center">
          <BackLink to="/jobs">Back to all openings</BackLink>
        </div>
      </div>
    );
  }

  const { job, hasApplied, canApply } = data;
  const employmentType = EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType;

  const details = [
    { icon: MapPin, label: 'Location', value: job.location },
    {
      icon: Briefcase,
      label: 'Experience',
      value: formatExperience(job.experienceMin, job.experienceMax),
    },
    {
      icon: Users,
      label: 'Openings',
      value: `${job.openings} · ${employmentType}`,
    },
    { icon: Calendar, label: 'Apply by', value: formatDate(job.lastDateToApply) },
  ];

  const hasRequirements =
    job.qualification || job.subjects?.length > 0 || job.skills?.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink to="/jobs">All openings</BackLink>

      {/* Title gets the full width; the actions sit on their own line below
          it on tablets and move to the side panel on desktop. */}
      <header className="rule-gold mt-5 pb-5">
        <h1 className="max-w-[24ch] font-serif text-title font-semibold text-ink sm:text-display">
          {job.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-ink-soft">
          <span>{job.department}</span>
          <span aria-hidden="true" className="text-ink-soft/40">·</span>
          <span>Yugam International School</span>
          <span aria-hidden="true" className="text-ink-soft/40">·</span>
          <span>{employmentType}</span>
        </p>

        <div className="mt-5 hidden flex-wrap items-center gap-2 sm:flex lg:hidden">
          <ApplyButton jobId={job._id} hasApplied={hasApplied} canApply={canApply} />
          <ShareJob job={job} />
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Key facts — inline on phones and tablets, in the side panel on desktop. */}
          <Card className="p-5 lg:hidden">
            <dl className="grid grid-cols-1 gap-4 xs:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-start gap-3">
                  <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-plum-500" aria-hidden="true" />
                  <div>
                    <dt className="text-meta text-ink-soft">{detail.label}</dt>
                    <dd className="tabular mt-0.5 text-ui font-semibold text-ink">{detail.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>

          <section>
            <h2 className="font-serif text-heading font-semibold text-ink">About the role</h2>
            {/* Descriptions are authored as plain text; RichText renders them
                as text nodes, never HTML — no injection surface. */}
            <RichText text={job.description} className="mt-4" />
          </section>

          {hasRequirements ? (
            <div className="space-y-6">
              {job.qualification ? (
                <Section title="Qualification required" icon={GraduationCap}>
                  <p className="max-w-measure text-body leading-relaxed text-ink">
                    {job.qualification}
                  </p>
                </Section>
              ) : null}

              {job.subjects?.length > 0 ? (
                <Section title="Subjects">
                  <div className="flex flex-wrap gap-1.5">
                    {job.subjects.map((subject) => (
                      <Badge key={subject} className="bg-plum-50 text-plum-800">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </Section>
              ) : null}

              {job.skills?.length > 0 ? (
                <Section title="Skills we look for">
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <Badge key={skill} className="border border-line bg-card text-ink-soft">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Section>
              ) : null}
            </div>
          ) : null}

          <div className="hidden flex-wrap items-center justify-between gap-4 rounded-card border border-line/80 bg-field shadow-card px-5 py-4 sm:flex lg:hidden">
            <p className="text-ui text-ink-soft">
              Applications close on{' '}
              <span className="tabular font-semibold text-ink">{formatDate(job.lastDateToApply)}</span>.
            </p>
            <ApplyButton jobId={job._id} hasApplied={hasApplied} canApply={canApply} />
          </div>
        </div>

        {/* Desktop side panel: the facts and the action stay in view while
            the description scrolls. */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24 overflow-hidden">
            <dl className="divide-y divide-line">
              {details.map((detail) => (
                <div key={detail.label} className="flex items-start gap-3 px-5 py-3.5">
                  <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-plum-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-meta text-ink-soft">{detail.label}</dt>
                    <dd className="tabular mt-0.5 text-ui font-semibold text-ink">{detail.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="space-y-2 border-t border-line bg-field px-5 py-4">
              <ApplyButton
                jobId={job._id}
                hasApplied={hasApplied}
                canApply={canApply}
                className="w-full"
              />
              <ShareJob job={job} fullWidth />
            </div>
          </Card>
        </aside>
      </div>

      {/* Mobile: the primary action is never scrolled away. */}
      <div className="h-24 sm:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-meta text-ink-soft">Closes</p>
            <p className="tabular truncate text-ui font-semibold text-ink">
              {formatDate(job.lastDateToApply)}
            </p>
          </div>
          <ShareJob job={job} variant="ghost" iconOnly menuAbove />
          <ApplyButton
            jobId={job._id}
            hasApplied={hasApplied}
            canApply={canApply}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
};
