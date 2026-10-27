import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, Badge } from './ui.jsx';
import { ShareJob } from './ShareJob.jsx';
import { formatDate, formatExperience, jobPath } from '../lib/format.js';
import { EMPLOYMENT_TYPE_LABELS } from '../lib/constants.js';

export const JobCard = ({ job, hasApplied = false }) => {
  const tags = [
    ...(job.subjects ?? []).map((tag) => ({ tag, subject: true })),
    ...(job.skills ?? []).map((tag) => ({ tag, subject: false })),
  ];
  const shown = tags.slice(0, 4);
  const hidden = tags.length - shown.length;

  return (
    <Card interactive className="group relative flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-heading font-semibold text-ink">
            {/* The title link stretches over the whole card, so anywhere on it
                opens the role; Share sits above it and stays its own target. */}
            <Link
              to={jobPath(job)}
              className="rounded-control transition-colors duration-micro after:absolute after:inset-0 after:rounded-card group-hover:text-plum-700"
            >
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-ui text-ink-soft">{job.department}</p>
        </div>

        {hasApplied ? (
          <Badge className="shrink-0 bg-status-selected text-status-selected-ink">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Applied
          </Badge>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2 text-ui text-ink-soft xs:grid-cols-2 md:grid-cols-1">
        <div className="flex min-w-0 items-center gap-2">
          <dt className="sr-only">Location</dt>
          <MapPin className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
          <dd className="truncate">{job.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Experience</dt>
          <Briefcase className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
          <dd>{formatExperience(job.experienceMin, job.experienceMax)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Closing date</dt>
          <Calendar className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
          <dd className="tabular">Apply by {formatDate(job.lastDateToApply)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Openings</dt>
          <Users className="h-4 w-4 shrink-0 text-ink-soft/70" aria-hidden="true" />
          <dd>
            {job.openings} opening{job.openings === 1 ? '' : 's'} ·{' '}
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
          </dd>
        </div>
      </dl>

      {shown.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {shown.map(({ tag, subject }) => (
            <Badge
              key={tag}
              className={
                subject
                  ? 'bg-plum-50 font-medium text-plum-800'
                  : 'border border-line bg-paper font-medium text-ink-soft'
              }
            >
              {tag}
            </Badge>
          ))}
          {hidden > 0 ? (
            <Badge className="font-medium text-ink-soft">+{hidden} more</Badge>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-ui font-semibold text-plum-600 transition-colors duration-micro group-hover:text-plum-800"
          >
            View details
            <ChevronRight className="h-4 w-4 transition-transform duration-base ease-out-soft group-hover:translate-x-0.5" />
          </span>
          <ShareJob job={job} variant="ghost" className="relative z-10" />
        </div>
      </div>
    </Card>
  );
};
