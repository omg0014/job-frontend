import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Users, Pencil, Trash2, Briefcase, Search, GitCompare, Lock, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  Card,
  Button,
  ButtonLink,
  PageHeader,
  Toolbar,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../components/ui.jsx';
import { TableSkeleton } from '../../components/Loading.jsx';
import { JobStatusBadge } from '../../components/StatusBadge.jsx';
import { Field, Select, Input } from '../../components/form.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { ShareJob } from '../../components/ShareJob.jsx';
import { formatDate, formatExperience } from '../../lib/format.js';
import { useDebounced } from '../../hooks/useDebounced.js';

export const AdminJobsPage = () => {
  // One line: rows reposition smoothly on filter instead of jumping.
  const [listRef] = useAutoAnimate();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounced(search, 400);
  const filters = {
    page,
    limit: 10,
    status,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-jobs', filters],
    queryFn: () => request(endpoints.jobs.list, filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const updateStatus = useMutation({
    mutationFn: (body) => request(endpoints.jobs.updateStatus, body),
    onSuccess: (_, variables) => {
      invalidate();
      toast.success(variables.status === 'open' ? 'Job reopened' : 'Job closed');
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const deleteJob = useMutation({
    mutationFn: (jobId) => request(endpoints.jobs.delete, { jobId }),
    onSuccess: () => {
      invalidate();
      setPendingDelete(null);
      toast.success('Job deleted');
    },
    onError: (mutationError) => {
      setPendingDelete(null);
      toast.error(mutationError.message);
    },
  });

  const jobs = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Post, edit and close openings."
        actions={
          <ButtonLink to="/admin/jobs/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Post a job
          </ButtonLink>
        }
      />

      <Toolbar>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field label="Search" htmlFor="job-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
                aria-hidden="true"
              />
              <Input
                id="job-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Title, subject, department…"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Status" htmlFor="job-status">
            <Select
              id="job-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </Select>
          </Field>
        </div>
      </Toolbar>

      {isLoading ? (
        <Card className="p-4">
          <TableSkeleton rows={5} />
        </Card>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            search || status !== 'all'
              ? 'Try a different search or status filter.'
              : 'Post your first opening to start receiving applications.'
          }
          action={
            <ButtonLink to="/admin/jobs/new" size="sm">
              Post a job
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul
            ref={listRef}
            className="divide-y divide-line rounded-card border border-line/80 bg-field shadow-card"
          >
            {jobs.map((job) => (
              <li
                key={job._id}
                className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <Link
                      to={`/admin/jobs/${job._id}/applicants`}
                      className="rounded-control font-serif text-body font-semibold leading-snug text-ink transition-colors duration-micro hover:text-plum-700"
                    >
                      {job.title}
                    </Link>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className="mt-1 text-meta text-ink-soft">
                    {job.department} · {job.location} ·{' '}
                    {formatExperience(job.experienceMin, job.experienceMax)}
                  </p>
                  <p className="tabular mt-0.5 text-meta text-ink-soft">
                    {job.openings} opening{job.openings === 1 ? '' : 's'} · closes{' '}
                    {formatDate(job.lastDateToApply)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap lg:justify-end">
                  {/* The one thing HR opens most — it leads, the rest stay quiet. */}
                  <ButtonLink
                    to={`/admin/jobs/${job._id}/applicants`}
                    variant="secondary"
                    size="sm"
                    className="mr-1 tabular"
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {job.applicationCount} applicant
                    {job.applicationCount === 1 ? '' : 's'}
                  </ButtonLink>

                  <ShareJob job={job} variant="ghost" />

                  <ButtonLink to={`/admin/jobs/${job._id}/compare?q=1`} variant="ghost" size="sm">
                    <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                    Compare
                  </ButtonLink>

                  <ButtonLink
                    to={`/admin/jobs/${job._id}/edit`}
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${job.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </ButtonLink>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updateStatus.isPending}
                    aria-label={`${job.status === 'open' ? 'Close' : 'Reopen'} ${job.title}`}
                    onClick={() =>
                      updateStatus.mutate({
                        jobId: job._id,
                        status: job.status === 'open' ? 'closed' : 'open',
                      })
                    }
                  >
                    {job.status === 'open' ? (
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {job.status === 'open' ? 'Close' : 'Reopen'}
                  </Button>

                  <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={() => setPendingDelete(job)}
                    className="rounded-control p-2 text-ink-soft/70 transition-colors duration-micro hover:bg-status-rejected hover:text-status-rejected-ink"
                    aria-label={`Delete ${job.title}`}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this job?"
        message={`"${pendingDelete?.title}" will be removed from the careers site. Applications already received are kept.`}
        confirmLabel="Delete job"
        destructive
        loading={deleteJob.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => deleteJob.mutate(pendingDelete._id)}
      />
    </div>
  );
};
