import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Bookmark, Trash2, Search, Mail, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  Badge,
  Toolbar,
  MeritBadge,
  PageHeader,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../components/ui.jsx';
import { ListSkeleton } from '../../components/Loading.jsx';
import { Field, Input } from '../../components/form.jsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.jsx';
import { useDebounced } from '../../hooks/useDebounced.js';
import { formatDate } from '../../lib/format.js';

export const TalentPoolPage = () => {
  // One line: rows reposition smoothly on filter instead of jumping.
  const [listRef] = useAutoAnimate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingRemove, setPendingRemove] = useState(null);
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounced(search, 400);
  const filters = { page, limit: 10, ...(debouncedSearch ? { q: debouncedSearch } : {}) };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['talent-pool', filters],
    queryFn: () => request(endpoints.talentPool.list, filters),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (entryId) => request(endpoints.talentPool.remove, { entryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] });
      setPendingRemove(null);
      toast.success('Removed from the talent pool');
    },
    onError: (mutationError) => {
      setPendingRemove(null);
      toast.error(mutationError.message);
    },
  });

  const entries = data?.items ?? [];

  return (
    <div>
      {/* The honour board: the one page where gold is allowed to lead. */}
      <PageHeader
        title="Talent pool"
        description="Candidates kept on file for future openings."
        meta={
          typeof data?.total === 'number' && data.total > 0 ? (
            <MeritBadge>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              {data.total} on file
            </MeritBadge>
          ) : null
        }
      />

      <Toolbar>
        <div className="sm:max-w-sm">
          <Field label="Search" htmlFor="pool-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
                aria-hidden="true"
              />
              <Input
                id="pool-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Name, subject, skill…"
                className="pl-9"
              />
            </div>
          </Field>
        </div>
      </Toolbar>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={search ? 'No candidates match your search' : 'The talent pool is empty'}
          description={
            search
              ? 'Try a different name, subject or skill.'
              : 'Save a promising candidate from their application page to keep them on file.'
          }
        />
      ) : (
        <>
          <ul
            ref={listRef}
            className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card"
          >
            {entries.map((entry) => {
              const profile = entry.profile ?? {};
              const candidate = entry.candidateId ?? {};
              const name = profile.fullName || candidate.name || 'Candidate';

              return (
                <li key={entry._id} className="flex gap-3.5 px-4 py-4 sm:gap-4 sm:px-5">
                  {/* Decorative gold marker — the honour-board line, never text. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-gold-50"
                  >
                    <Bookmark className="h-4 w-4 fill-gold-500/25 text-gold-500" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-serif text-ui font-semibold text-ink sm:text-body">{name}</h2>
                        {profile.headline ? (
                          <p className="mt-0.5 text-ui text-ink-soft">{profile.headline}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <span className="hidden text-meta text-gold-700 sm:inline">
                          Saved {formatDate(entry.addedAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingRemove(entry)}
                          className="rounded-control p-2 text-ink-soft/70 transition-colors duration-micro hover:bg-status-rejected hover:text-status-rejected-ink"
                          aria-label={`Remove ${profile.fullName ?? 'candidate'} from the talent pool`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-meta text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">Experience</dt>
                        <Briefcase className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                        <dd>{profile.totalExperienceYears ?? 0} years</dd>
                      </div>
                      {candidate.email ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <dt className="sr-only">Email</dt>
                          <Mail className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                          <dd className="min-w-0 truncate">
                            <a
                              href={`mailto:${candidate.email}`}
                              className="font-medium text-plum-600 underline-offset-2 hover:text-plum-800 hover:underline"
                            >
                              {candidate.email}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      {profile.location ? (
                        <div className="flex items-center gap-1.5">
                          <dt className="sr-only">Location</dt>
                          <MapPin className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                          <dd>{profile.location}</dd>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5 sm:hidden">
                        <dt className="sr-only">Saved</dt>
                        <dd className="text-gold-700">Saved {formatDate(entry.addedAt)}</dd>
                      </div>
                    </dl>

                    {entry.tags?.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} className="bg-plum-50 text-plum-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {entry.note ? (
                      <p className="mt-3 max-w-measure border-l-2 border-gold-500/60 pl-3 text-ui italic text-ink-soft">
                        {entry.note}
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

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove from talent pool?"
        message={`${pendingRemove?.profile?.fullName ?? 'This candidate'} will no longer appear in the pool. Their applications are unaffected.`}
        confirmLabel="Remove"
        destructive
        loading={remove.isPending}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => remove.mutate(pendingRemove._id)}
      />
    </div>
  );
};
