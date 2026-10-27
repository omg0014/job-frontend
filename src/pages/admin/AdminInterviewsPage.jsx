import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CalendarClock, Video, MapPinned, Star } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Toolbar, PageHeader, EmptyState, ErrorState, Pagination } from '../../components/ui.jsx';
import { ListSkeleton } from '../../components/Loading.jsx';
import { OutcomeBadge } from '../../components/StatusBadge.jsx';
import { Field, Input, Select } from '../../components/form.jsx';
import { formatDateTime } from '../../lib/format.js';
import { clsx } from '../../lib/clsx.js';

/** Weekday, day and month for the calendar block, in the viewer's locale. */
const dateParts = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { weekday: '', day: '–', month: '' };
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
  };
};

export const AdminInterviewsPage = () => {
  const [outcome, setOutcome] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const filters = {
    page,
    limit: 10,
    sortBy: 'scheduledAt',
    sortOrder: 'asc',
    ...(outcome ? { outcome } : {}),
    ...(from ? { from: new Date(from).toISOString() } : {}),
    // Include the whole of the end day, not just its first instant.
    ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['interviews', filters],
    queryFn: () => request(endpoints.interviews.list, filters),
    placeholderData: keepPreviousData,
  });

  const interviews = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Everything scheduled, with notes and ratings."
      />

      <Toolbar className="grid-cols-2 sm:grid-cols-3">
        <Field label="From" htmlFor="from">
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </Field>

        <Field label="To" htmlFor="to">
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </Field>

        <div className="col-span-2 sm:col-span-1">
          <Field label="Outcome" htmlFor="outcome">
            <Select
              id="outcome"
              value={outcome}
              onChange={(event) => {
                setOutcome(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All outcomes</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Did not pass</option>
            </Select>
          </Field>
        </div>
      </Toolbar>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No interviews found"
          description="Shortlist a candidate and schedule their interview from the applicant page."
        />
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
            {interviews.map((interview) => {
              const application = interview.applicationId;

              const candidateName = application?.profileSnapshot?.fullName ?? 'Candidate';
              const detailPath = application ? `/admin/applications/${application._id}` : null;
              const when = dateParts(interview.scheduledAt);

              return (
                <li
                  key={interview._id}
                  className={clsx(
                    'group relative flex gap-4 px-4 py-4 transition-colors duration-micro sm:gap-5 sm:px-5',
                    detailPath && 'hover:bg-plum-50/40',
                  )}
                >
                  {/* A calendar block: the day is what HR scans this page for. */}
                  <div className="flex w-14 shrink-0 flex-col items-center self-start rounded-control border border-line bg-field py-1.5 text-center">
                    <span className="text-[11px] font-medium leading-tight text-ink-soft">{when.weekday}</span>
                    <span data-stat className="text-title leading-none text-ink">{when.day}</span>
                    <span className="mt-0.5 text-[11px] font-medium leading-tight text-plum-700">{when.month}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <div className="min-w-0">
                        <h2 className="text-ui font-semibold text-ink sm:text-body">
                          {detailPath ? (
                            // A stretched link makes the whole row the target
                            // while keeping one real anchor for the keyboard and
                            // for screen readers. Controls that must stay
                            // separately clickable sit above it with z-10.
                            <Link
                              to={detailPath}
                              className="after:absolute after:inset-0 group-hover:text-plum-700"
                            >
                              {candidateName}
                              <span className="sr-only"> — open profile and interview details</span>
                            </Link>
                          ) : (
                            candidateName
                          )}
                        </h2>
                        <p className="mt-0.5 text-ui text-ink-soft">
                          {application?.jobId?.title ?? 'Role'}
                          {application?.jobId?.department ? ` · ${application.jobId.department}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {interview.rating ? (
                          <span
                            className="flex items-center gap-0.5 text-meta text-ink-soft"
                            aria-label={`Rated ${interview.rating} out of 5`}
                          >
                            <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" aria-hidden="true" />
                            <span className="tabular" aria-hidden="true">{interview.rating} / 5</span>
                          </span>
                        ) : null}
                        <OutcomeBadge outcome={interview.outcome} />
                      </div>
                    </div>

                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1.5 text-meta text-ink-soft">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                        <time dateTime={interview.scheduledAt}>{formatDateTime(interview.scheduledAt)}</time>
                      </span>
                      <span className="flex min-w-0 max-w-full items-center gap-1.5">
                        {interview.mode === 'online' ? (
                          <Video className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                        ) : (
                          <MapPinned className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                        )}
                        {interview.mode === 'online' && /^https?:\/\//.test(interview.locationOrLink) ? (
                          <a
                            href={interview.locationOrLink}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(event) => event.stopPropagation()}
                            className="relative z-10 truncate font-semibold text-plum-600 underline-offset-2 hover:underline"
                          >
                            {interview.locationOrLink}
                          </a>
                        ) : (
                          <span className="truncate">{interview.locationOrLink}</span>
                        )}
                      </span>
                      {interview.interviewerName ? <span>With {interview.interviewerName}</span> : null}
                    </div>

                    {interview.notes ? (
                      <p className="mt-2.5 max-w-measure border-l-2 border-line pl-3 text-ui text-ink-soft">
                        {interview.notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
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
