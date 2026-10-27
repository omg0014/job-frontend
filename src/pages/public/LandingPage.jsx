import { useQuery } from '@tanstack/react-query';
import { MapPin, Briefcase, Calendar, ChevronRight, Upload, MousePointerClick, ListChecks } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { ButtonLink, EmptyState, List, ListRow, SectionHeader, TextLink } from '../../components/ui.jsx';
import { Skeleton } from '../../components/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, formatExperience, jobPath } from '../../lib/format.js';

const DAY = 24 * 60 * 60 * 1000;

/** Whole days until a closing date, or null when there is none. */
const daysUntil = (value) => {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / DAY);
};

/**
 * A teacher's first question is "is there a job for me", so the openings are a
 * plain list directly under the hero — not a card grid, and not behind a
 * marketing section. The whole row is the link.
 */
const OpeningRow = ({ job }) => {
  const days = daysUntil(job.lastDateToApply);
  const closingSoon = days !== null && days >= 0 && days <= 7;

  return (
    <ListRow to={jobPath(job)} className="group py-4 sm:py-5">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h3 className="font-serif text-heading font-semibold text-ink transition-colors duration-micro group-hover:text-plum-700">
              {job.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui text-ink-soft">
              <span>{job.department}</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                {formatExperience(job.experienceMin, job.experienceMax)}
              </span>
            </div>
          </div>

          <p className="tabular mt-2 flex shrink-0 items-center gap-1.5 text-ui text-ink-soft sm:mt-0">
            <Calendar className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
            Apply by {formatDate(job.lastDateToApply)}
            {closingSoon ? (
              <span className="ml-1 rounded-full bg-plum-50 px-2 py-0.5 text-meta font-semibold text-plum-700">
                {days === 0 ? 'Closes today' : `${days} day${days === 1 ? '' : 's'} left`}
              </span>
            ) : null}
          </p>
        </div>

        <ChevronRight
          className="h-5 w-5 shrink-0 text-ink-soft/50 transition-[color,transform] duration-base ease-out-soft group-hover:translate-x-0.5 group-hover:text-plum-600"
          aria-hidden="true"
        />
      </div>
    </ListRow>
  );
};

/**
 * Three plain facts about what is open, drawn from the list already fetched.
 * It fills the hero's right side with something a teacher can use, rather
 * than an illustration.
 */
const HeroFacts = ({ total, jobs }) => {
  const departments = new Set(jobs.map((job) => job.department).filter(Boolean)).size;
  const nextClosing = jobs
    .map((job) => job.lastDateToApply)
    .filter((date) => date && daysUntil(date) >= 0)
    .sort((a, b) => new Date(a) - new Date(b))[0];

  const facts = [
    { label: total === 1 ? 'Open role' : 'Open roles', value: total },
    { label: departments === 1 ? 'Department hiring' : 'Departments hiring', value: departments },
  ];

  return (
    <div className="rounded-card border border-white/15 bg-white/[0.06] p-6 shadow-header backdrop-blur-md">
      <dl className="grid grid-cols-2 gap-6">
        {facts.map((fact) => (
          // Label first in the markup, number first on screen.
          <div key={fact.label} className="flex flex-col-reverse">
            <dt className="mt-1 text-ui text-white/70">{fact.label}</dt>
            <dd data-stat className="font-serif text-hero text-gold-500">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
      {nextClosing ? (
        <p className="mt-6 border-t border-white/10 pt-4 text-ui text-white/70">
          Next closing date{' '}
          <span className="tabular font-semibold text-white">{formatDate(nextClosing)}</span>
        </p>
      ) : null}
    </div>
  );
};

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your CV',
    body: 'We read it and fill in your profile. You can fix anything we get wrong.',
  },
  {
    icon: MousePointerClick,
    title: 'Apply in one click',
    body: 'Your profile and CV go with every application. No forms to repeat.',
  },
  {
    icon: ListChecks,
    title: 'Follow your progress',
    body: 'See exactly where your application stands, and hear from us at each step.',
  },
];

export const LandingPage = () => {
  const { user } = useAuth();
  const filters = { page: 1, limit: 8 };

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => request(endpoints.jobs.list, filters),
    staleTime: 60000,
  });

  const jobs = data?.items ?? [];

  return (
    <div>
      {/* Deep purple hero, gold type. Kept short so openings stay above the fold. */}
      <section className="relative isolate overflow-hidden bg-plum-900">
        {/* Depth, in palette plum only: a soft light pooled top-right and a
            faint dot grid that fades out toward the content. No gold moves. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-plum-600/30 blur-3xl" />
          <div className="absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-plum-700/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div>
            {/* The headline gets its own measure — a hero wants far fewer
                characters per line than body copy. */}
            <h1 className="max-w-[17ch] animate-rise-in font-serif text-display font-semibold text-gold-500 sm:text-hero">
              Teach at Yugam International School
            </h1>
            {/* Standfirst: a step up from body so it carries under a 44px
                headline, and a wider measure than the headline above it. */}
            <p className="mt-5 max-w-[52ch] animate-rise-in text-body [animation-delay:80ms] font-normal leading-[1.6] text-white/85 sm:text-heading sm:leading-[1.55]">
              We are looking for teachers who care about how children learn. Upload your CV
              once, and apply to any opening in a single click.
            </p>
            {!user ? (
              <div className="mt-8 flex animate-rise-in flex-col gap-3 [animation-delay:160ms] xs:flex-row xs:flex-wrap">
                <ButtonLink to="/register" size="lg">
                  Create your account
                </ButtonLink>
                <ButtonLink
                  to="/jobs"
                  size="lg"
                  variant="secondary"
                  className="border-white/25 bg-transparent text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  Browse all roles
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-8 animate-rise-in [animation-delay:160ms]">
                <ButtonLink to="/jobs" size="lg">
                  Browse all roles
                </ButtonLink>
              </div>
            )}
          </div>

          {/* Desktop only — on a phone the openings list right below says the same thing. */}
          {data?.total ? (
            <div className="hidden animate-rise-in [animation-delay:220ms] lg:block">
              <HeroFacts total={data.total} jobs={jobs} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rule-gold mb-5 pb-4">
          <SectionHeader
            className="mb-0"
            title={<span className="text-title">Current openings</span>}
            description={
              data?.total
                ? `${data.total} ${data.total === 1 ? 'role is' : 'roles are'} open right now`
                : 'Roles we are hiring for'
            }
            action={<TextLink to="/jobs">See all roles</TextLink>}
          />
        </div>

        {isLoading ? (
          <List as="div">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key -- static placeholders
              <div key={index} className="px-4 py-5 sm:px-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-2.5 h-3.5 w-1/2" />
              </div>
            ))}
          </List>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No openings right now"
            description="Create an account and we will let you know when a role opens."
            action={
              !user ? (
                <ButtonLink to="/register" size="sm">
                  Create an account
                </ButtonLink>
              ) : null
            }
          />
        ) : (
          <>
            <List>
              {jobs.map((job) => (
                <OpeningRow key={job._id} job={job} />
              ))}
            </List>
            {data?.total > jobs.length ? (
              <div className="mt-4 text-center">
                <TextLink to="/jobs">See all {data.total} roles</TextLink>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-serif text-title font-semibold text-ink">How applying works</h2>
          <p className="mt-1.5 text-ui text-ink-soft">Three steps, and you only do the first one once.</p>

          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-line pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-plum-50 text-plum-700">
                    <step.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="tabular font-serif text-ui font-semibold text-gold-700">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-heading font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 max-w-measure text-ui leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          {!user ? (
            <div className="mt-10">
              <ButtonLink to="/register">Get started</ButtonLink>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
