import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, MapPin, CalendarClock, Video, MapPinned, ChevronRight, PlayCircle } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { Card, ButtonLink, PageHeader, EmptyState, ErrorState, Pagination } from '../../components/ui.jsx';
import { ListSkeleton } from '../../components/Loading.jsx';
import { StatusBadge, PipelineStepper } from '../../components/StatusBadge.jsx';
import { SelectedMoment } from '../../components/SelectedMoment.jsx';
import { Field, Select } from '../../components/form.jsx';
import { APPLICATION_STATUS } from '../../lib/constants.js';
import { formatDate, formatDateTime, jobPath } from '../../lib/format.js';

export const MyApplicationsPage = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const filters = { page, limit: 10, ...(status ? { status } : {}) };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-applications', filters],
    queryFn: () => request(endpoints.applications.myList, filters),
    placeholderData: keepPreviousData,
  });

  const applications = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="My applications"
        description="Where each of your applications stands right now."
      />

      <div className="mb-6 w-full sm:max-w-xs">
        <Field label="Filter by status" htmlFor="status">
          <Select
            id="status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All applications</option>
            {Object.entries(APPLICATION_STATUS).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={status ? 'No applications with this status' : 'No applications yet'}
          description={
            status
              ? 'Try a different status filter.'
              : 'Browse open roles to get started.'
          }
          action={
            <ButtonLink to="/jobs" size="sm">
              Browse open roles
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="space-y-6">
            {applications.map((application) => {
              const job = application.jobId;
              const interview = application.interview;

              return (
                <Card key={application._id} className="overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <h2 className="font-serif text-heading font-semibold text-ink">
                          {job ? (
                            <Link
                              to={jobPath(job)}
                              className="rounded-control transition-colors duration-micro hover:text-plum-700"
                            >
                              {job.title}
                            </Link>
                          ) : (
                            'Job no longer listed'
                          )}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui text-ink-soft">
                          {job?.department ? <span>{job.department}</span> : null}
                          {job?.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                              {job.location}
                            </span>
                          ) : null}
                          <span>Applied {formatDate(application.appliedAt)}</span>
                        </div>
                      </div>
                      <StatusBadge status={application.status} className="self-start" />
                    </div>

                    {application.status === 'selected' ? (
                      <div className="mt-5">
                        <SelectedMoment
                          applicationId={application._id}
                          jobTitle={job?.title ?? 'this role'}
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* The stepper sits in its own quiet band so position in the
                      pipeline reads at a glance, before any text. */}
                  <div className="border-t border-line bg-paper/60 px-3 py-5 sm:px-6">
                    <PipelineStepper status={application.status} />
                  </div>

                  {application.status === 'screening' || interview ? (
                    <div className="space-y-4 border-t border-line p-5 sm:p-6">
                      {/* The screening round is the candidate's move, so it
                          gets a real call to action rather than another line. */}
                      {application.status === 'screening' ? (
                        <div className="rounded-card border border-plum-200 bg-plum-50 p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-plum-600" aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-ui font-semibold text-ink">
                                  Record your video screening
                                </p>
                                <p className="mt-1 max-w-measure text-ui leading-relaxed text-ink-soft">
                                  Five short questions and a few details about your current role.
                                  It takes about 10 minutes, and you can do it whenever suits you.
                                </p>
                              </div>
                            </div>
                            <ButtonLink
                              to={`/applications/${application._id}/screening/consent`}
                              className="w-full sm:w-auto"
                            >
                              Start screening
                            </ButtonLink>
                          </div>
                        </div>
                      ) : null}

                      {interview ? (
                        <div className="flex items-start gap-3 rounded-card border border-line bg-field p-4 sm:p-5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plum-50">
                            <CalendarClock className="h-[18px] w-[18px] text-plum-600" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-ui font-semibold text-ink">
                              Interview on {formatDateTime(interview.scheduledAt)}
                            </p>
                            <p className="mt-1 flex items-start gap-1.5 text-ui text-ink-soft">
                              {interview.mode === 'online' ? (
                                <Video className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <MapPinned className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              )}
                              {interview.mode === 'online' ? (
                                <a
                                  href={interview.locationOrLink}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="min-w-0 break-all font-semibold text-plum-600 underline underline-offset-2 hover:text-plum-800"
                                >
                                  {interview.locationOrLink}
                                </a>
                              ) : (
                                <span className="min-w-0 break-words">{interview.locationOrLink}</span>
                              )}
                            </p>
                            {interview.interviewerName ? (
                              <p className="mt-1 text-meta text-ink-soft">
                                With <span className="font-semibold text-ink">{interview.interviewerName}</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {application.statusHistory?.length > 1 ? (
                    <details className="group border-t border-line">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3.5 text-ui font-semibold text-ink-soft transition-colors duration-micro hover:bg-paper/60 hover:text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-base ease-out-soft group-open:rotate-90"
                          aria-hidden="true"
                        />
                        Application history
                      </summary>
                      <ol className="space-y-3 border-l border-line pb-5 pl-5 ml-7 sm:ml-8">
                        {[...application.statusHistory].reverse().map((entry, index) => (
                          <li
                            // eslint-disable-next-line react/no-array-index-key -- history is append-only and static once rendered
                            key={index}
                            className="relative text-meta text-ink-soft"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute -left-[23px] top-1.5 h-1.5 w-1.5 rounded-full bg-plum-300"
                            />
                            <span className="font-semibold text-ink">
                              {APPLICATION_STATUS[entry.status]?.label ?? entry.status}
                            </span>
                            <span className="ml-2">{formatDate(entry.changedAt)}</span>
                            {entry.note ? <p className="mt-0.5 italic">{entry.note}</p> : null}
                          </li>
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </Card>
              );
            })}
          </div>

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
