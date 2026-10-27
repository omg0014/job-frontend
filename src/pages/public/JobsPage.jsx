import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Briefcase, X } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { JobCard } from '../../components/JobCard.jsx';
import { CardSkeleton } from '../../components/Loading.jsx';
import { EmptyState, ErrorState, Pagination, Button, PageHeader, Toolbar } from '../../components/ui.jsx';
import { clsx } from '../../lib/clsx.js';
import { Input, Select, Field } from '../../components/form.jsx';
import { useTaxonomy } from '../../hooks/useTaxonomy.js';
import { useDebounced } from '../../hooks/useDebounced.js';

const emptyFilters = { q: '', department: '', location: '', minExp: '' };

export const JobsPage = () => {
  const [draft, setDraft] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const { data: taxonomy } = useTaxonomy();

  // Only the keyword is debounced — the selects apply immediately.
  const debouncedQ = useDebounced(draft.q, 400);

  const filters = {
    page,
    limit: 9,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(draft.department ? { department: draft.department } : {}),
    ...(draft.location ? { location: draft.location } : {}),
    ...(draft.minExp !== '' ? { minExp: Number(draft.minExp) } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    // The request body is part of the key — that is the whole cache strategy
    // for an API with no HTTP caching.
    queryKey: ['jobs', filters],
    queryFn: () => request(endpoints.jobs.list, filters),
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const updateFilter = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const hasFilters = Object.values(draft).some((value) => value !== '');
  const jobs = data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Current openings"
        description="Teaching and staff positions at Yugam International School."
      />

      <Toolbar className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search" htmlFor="q">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
                aria-hidden="true"
              />
              <Input
                id="q"
                value={draft.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Physics, PGT, primary…"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Department" htmlFor="department">
            <Select
              id="department"
              value={draft.department}
              onChange={(event) => updateFilter('department', event.target.value)}
            >
              <option value="">All departments</option>
              {(taxonomy?.departments ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              value={draft.location}
              onChange={(event) => updateFilter('location', event.target.value)}
              placeholder="Coimbatore"
            />
          </Field>

          <Field label="My experience" htmlFor="minExp" hint="Shows roles you qualify for">
            <Select
              id="minExp"
              value={draft.minExp}
              onChange={(event) => updateFilter('minExp', event.target.value)}
            >
              <option value="">Any</option>
              {[0, 1, 2, 3, 5, 8, 10, 15].map((years) => (
                <option key={years} value={years}>
                  {years === 0 ? 'Fresher' : `${years}+ years`}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {hasFilters ? (
          <div className="-mb-1 flex items-center justify-between gap-3 border-t border-line pt-3">
            <p className="tabular text-meta text-ink-soft" aria-live="polite">
              {typeof data?.total === 'number'
                ? `${data.total} role${data.total === 1 ? '' : 's'} match`
                : 'Filtering…'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(emptyFilters);
                setPage(1);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </Button>
          </div>
        ) : null}
      </Toolbar>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key -- static placeholders
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={hasFilters ? 'No jobs match your filters' : 'No openings right now'}
          description={
            hasFilters
              ? 'Try widening your search or clearing a filter.'
              : 'Please check back soon — new roles are posted regularly.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={() => setDraft(emptyFilters)}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div
            className={clsx(
              'grid gap-4 transition-opacity duration-base md:grid-cols-2 lg:grid-cols-3',
              isFetching && 'opacity-60',
            )}
            aria-busy={isFetching}
          >
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                hasApplied={data?.appliedJobIds?.includes(job._id)}
              />
            ))}
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
