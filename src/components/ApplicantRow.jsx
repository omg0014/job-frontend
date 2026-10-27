import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { Badge } from './ui.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { formatRelative } from '../lib/format.js';

/**
 * One applicant as a dense row inside a divided list. HR scans dozens of
 * these, so on a desktop the who, the contact details and the status sit on
 * one line each; on a phone they stack.
 */
export const ApplicantRow = ({ application, showJob = true }) => {
  const profile = application.profileSnapshot ?? {};
  const years = profile.totalExperienceYears ?? 0;

  return (
    <li>
      <Link
        to={`/admin/applications/${application._id}`}
        className="group grid gap-x-6 gap-y-2.5 px-4 py-4 transition-colors duration-micro hover:bg-plum-50/50 focus-visible:bg-plum-50/50 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_8.5rem] lg:items-start"
      >
        {/* Who, and for which role */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3 lg:block">
            <h3 className="truncate font-serif text-body font-semibold leading-snug text-ink transition-colors duration-micro group-hover:text-plum-800">
              {profile.fullName || 'Unnamed candidate'}
            </h3>
            {/* On a phone the status rides beside the name; on a desktop it
                has its own column on the right. */}
            <div className="flex shrink-0 flex-col items-end gap-1 lg:hidden">
              <StatusBadge status={application.status} />
              <span className="text-meta text-ink-soft">{formatRelative(application.appliedAt)}</span>
            </div>
          </div>
          {profile.headline ? (
            <p className="mt-0.5 line-clamp-2 text-meta text-ink-soft">{profile.headline}</p>
          ) : null}
          {showJob && application.jobId ? (
            <p className="mt-1 truncate text-meta font-semibold text-plum-600">
              {application.jobId.title}
            </p>
          ) : null}
        </div>

        {/* Facts and subjects */}
        <div className="min-w-0">
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-soft">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Experience</dt>
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
              <dd className="tabular">
                {years} year{years === 1 ? '' : 's'}
              </dd>
            </div>
            {profile.location ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Location</dt>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                <dd>{profile.location}</dd>
              </div>
            ) : null}
            {profile.phone ? (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Phone</dt>
                <Phone className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                <dd className="tabular">{profile.phone}</dd>
              </div>
            ) : null}
            {profile.email ? (
              <div className="flex min-w-0 max-w-full items-center gap-1.5">
                <dt className="sr-only">Email</dt>
                <Mail className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                <dd className="truncate">{profile.email}</dd>
              </div>
            ) : null}
          </dl>

          {profile.subjects?.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.subjects.slice(0, 5).map((subject) => (
                <Badge key={subject} className="bg-plum-50 text-plum-800">
                  {subject}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Status and when */}
        <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-1.5">
          <StatusBadge status={application.status} />
          <span className="text-meta text-ink-soft">{formatRelative(application.appliedAt)}</span>
        </div>
      </Link>
    </li>
  );
};
