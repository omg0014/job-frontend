import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { PageHeader, BackLink, EmptyState, ErrorState, Pagination } from '../../components/ui.jsx';
import { TableSkeleton } from '../../components/Loading.jsx';
import { ApplicantFilters } from '../../components/ApplicantFilters.jsx';
import { ApplicantRow } from '../../components/ApplicantRow.jsx';
import { JobStatusBadge } from '../../components/StatusBadge.jsx';
import { useTaxonomy } from '../../hooks/useTaxonomy.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { formatDate, formatExperience } from '../../lib/format.js';

const emptyFilters = { q: '', status: '', subject: '', minExp: '' };

/**
 * Serves two routes:
 *
 *   /admin/jobs/:id/applicants   applicants for one job
 *   /admin/applicants            every applicant the viewer can see, with an
 *                                optional ?status= preset from the dashboard
 *
 * The API already scopes results by role, so the all-applicants view shows an
 * admin everything and a principal only their team's jobs.
 */
export const JobApplicantsPage = () => {
  // One line: rows reposition smoothly on filter instead of jumping.
  const [listRef] = useAutoAnimate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const presetStatus = searchParams.get('status') ?? '';
  const [draft, setDraft] = useState({ ...emptyFilters, status: presetStatus });
  const [page, setPage] = useState(1);
  const { data: taxonomy } = useTaxonomy();

  const debouncedQ = useDebounced(draft.q, 400);

  const { data: jobData } = useQuery({
    queryKey: ['job', id],
    queryFn: () => request(endpoints.jobs.get, { jobId: id }),
    enabled: Boolean(id),
  });

  const filters = {
    ...(id ? { jobId: id } : {}),
    page,
    limit: 10,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(draft.status ? { status: draft.status } : {}),
    ...(draft.subject ? { subject: draft.subject } : {}),
    ...(draft.minExp !== '' ? { minExp: Number(draft.minExp) } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['applications', filters],
    queryFn: () => request(endpoints.applications.list, filters),
    placeholderData: keepPreviousData,
  });

  const updateFilter = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setPage(1);

    // Status lives in the URL on the all-applicants view, so the heading
    // reflects the filter and the view can be linked to or bookmarked.
    if (key === 'status' && !id) {
      setSearchParams(value ? { status: value } : {}, { replace: true });
    }
  };

  const job = jobData?.job;
  const applications = data?.items ?? [];
  const hasFilters = Object.values(draft).some((value) => value !== '');

  return (
    <div>
      <PageHeader
        dense
        back={
          <BackLink to={id ? '/admin/jobs' : '/admin'}>
            {id ? 'Back to jobs' : 'Back to dashboard'}
          </BackLink>
        }
        title={
          job
            ? `Applicants — ${job.title}`
            : presetStatus === 'shortlisted'
              ? 'Shortlisted candidates'
              : presetStatus === 'registered'
                ? 'Registered, not yet applied'
                : 'All applicants'
        }
        description={
          data
            ? id
              ? `${data.total} application${data.total === 1 ? '' : 's'} received`
              : presetStatus === 'shortlisted'
                ? `${data.total} candidate${data.total === 1 ? '' : 's'} shortlisted so far`
                : presetStatus === 'registered'
                  ? `${data.total} ${data.total === 1 ? 'person has' : 'people have'} signed up without applying yet`
                  : typeof data.registeredTotal === 'number' && data.registeredTotal > 0
                    ? `${data.applicationTotal} application${data.applicationTotal === 1 ? '' : 's'}, and ${data.registeredTotal} signed up without applying`
                    : `${data.total} application${data.total === 1 ? '' : 's'} across every role you manage`
            : undefined
        }
        meta={
          job ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-meta text-ink-soft">
              <JobStatusBadge status={job.status} />
              <span>{job.department}</span>
              <span aria-hidden="true">·</span>
              <span>{job.location}</span>
              <span aria-hidden="true">·</span>
              <span>{formatExperience(job.experienceMin, job.experienceMax)}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular">Closes {formatDate(job.lastDateToApply)}</span>
            </div>
          ) : null
        }
      />

      <ApplicantFilters
        values={draft}
        onChange={updateFilter}
        subjects={taxonomy?.subjects ?? []}
      />

      {isLoading ? (
        <div className="rounded-card border border-line/80 bg-field shadow-card p-4">
          <TableSkeleton rows={5} />
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No applicants match these filters' : 'No applications yet'}
          description={
            hasFilters
              ? 'Try widening your filters.'
              : 'Applications will appear here as candidates apply to this role.'
          }
        />
      ) : (
        <>
          <ul
            ref={listRef}
            className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card"
          >
            {applications.map((application) => (
              <ApplicantRow
                key={application._id}
                application={application}
                showJob={!id}
              />
            ))}
          </ul>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};
