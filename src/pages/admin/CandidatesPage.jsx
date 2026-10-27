import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Users, Search, Send, FileText, MapPin, Briefcase, Mail, Phone } from 'lucide-react';
import { request } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import {
  Badge,
  Toolbar,
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  Pagination,
} from '../../components/ui.jsx';
import { ListSkeleton } from '../../components/Loading.jsx';
import { Field, Input, Select } from '../../components/form.jsx';
import { OfferRoleDialog } from './OfferRoleDialog.jsx';
import { useTaxonomy } from '../../hooks/useTaxonomy.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { formatRelative } from '../../lib/format.js';
import { initialsOf } from '../../components/NavDrawer.jsx';

const emptyFilters = { q: '', subject: '', minExp: '', applied: '', hasCv: '' };

/**
 * Everyone who has an account, whether or not they have applied.
 *
 * Distinct from the applicant list, which is a queue of applications to act
 * on. This is a search: who is available, what do they teach, and can we point
 * them at a role.
 */
export const CandidatesPage = () => {
  const [listRef] = useAutoAnimate();
  const [draft, setDraft] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [offering, setOffering] = useState(null);
  const { data: taxonomy } = useTaxonomy();

  const debouncedQ = useDebounced(draft.q, 400);

  const filters = {
    page,
    limit: 12,
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(draft.subject ? { subject: draft.subject } : {}),
    ...(draft.minExp !== '' ? { minExp: Number(draft.minExp) } : {}),
    ...(draft.applied !== '' ? { applied: draft.applied === 'yes' } : {}),
    ...(draft.hasCv !== '' ? { hasCv: draft.hasCv === 'yes' } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => request(endpoints.candidates.list, filters),
    placeholderData: keepPreviousData,
  });

  const updateFilter = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const hasFilters = Object.values(draft).some((value) => value !== '');
  const candidates = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Everyone registered with the school, whether or not they have applied. Search here to offer someone a role directly."
      />

      <Toolbar className="grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="col-span-2 lg:col-span-1">
          <Field label="Search" htmlFor="cand-q">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
                aria-hidden="true"
              />
              <Input
                id="cand-q"
                value={draft.q}
                onChange={(event) => updateFilter('q', event.target.value)}
                placeholder="Name, skill, qualification…"
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        <Field label="Subject" htmlFor="cand-subject">
          <Select
            id="cand-subject"
            value={draft.subject}
            onChange={(event) => updateFilter('subject', event.target.value)}
          >
            <option value="">Any subject</option>
            {(taxonomy?.subjects ?? []).map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Experience" htmlFor="cand-exp">
          <Select
            id="cand-exp"
            value={draft.minExp}
            onChange={(event) => updateFilter('minExp', event.target.value)}
          >
            <option value="">Any</option>
            <option value="0">Fresher</option>
            {[1, 3, 5, 8, 10, 15].map((years) => (
              <option key={years} value={years}>
                {years}+ years
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Has applied" htmlFor="cand-applied">
          <Select
            id="cand-applied"
            value={draft.applied}
            onChange={(event) => updateFilter('applied', event.target.value)}
          >
            <option value="">Either</option>
            <option value="yes">Has applied</option>
            <option value="no">Never applied</option>
          </Select>
        </Field>

        <Field label="Has a CV" htmlFor="cand-cv">
          <Select
            id="cand-cv"
            value={draft.hasCv}
            onChange={(event) => updateFilter('hasCv', event.target.value)}
          >
            <option value="">Either</option>
            <option value="yes">CV uploaded</option>
            <option value="no">No CV yet</option>
          </Select>
        </Field>
      </Toolbar>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No candidates match these filters' : 'No candidates yet'}
          description={
            hasFilters
              ? 'Try widening the subject or experience range.'
              : 'Teachers appear here as soon as they create an account.'
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
          <ul
            ref={listRef}
            className="divide-y divide-line overflow-hidden rounded-card border border-line/80 bg-field shadow-card"
          >
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="grid gap-x-6 gap-y-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_220px]"
              >
                <div className="flex min-w-0 gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-50 text-meta font-semibold text-plum-800"
                  >
                    {initialsOf(candidate.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="text-ui font-semibold text-ink sm:text-body">{candidate.name}</h2>
                      {candidate.applicationCount > 0 ? (
                        <Badge className="bg-status-applied text-status-applied-ink">
                          {candidate.applicationCount} application
                          {candidate.applicationCount === 1 ? '' : 's'}
                        </Badge>
                      ) : (
                        <Badge className="bg-plum-50 text-plum-800">Not applied yet</Badge>
                      )}
                    </div>
                    {candidate.headline ? (
                      <p className="mt-0.5 line-clamp-2 text-ui text-ink-soft">{candidate.headline}</p>
                    ) : null}

                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-meta text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">Experience</dt>
                        <Briefcase className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                        <dd>
                          {candidate.totalExperienceYears} year
                          {candidate.totalExperienceYears === 1 ? '' : 's'}
                        </dd>
                      </div>
                      {candidate.location ? (
                        <div className="flex items-center gap-1.5">
                          <dt className="sr-only">Location</dt>
                          <MapPin className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                          <dd>{candidate.location}</dd>
                        </div>
                      ) : null}
                      <div className="flex min-w-0 items-center gap-1.5">
                        <dt className="sr-only">Email</dt>
                        <Mail className="h-3.5 w-3.5 shrink-0 text-ink-soft/70" aria-hidden="true" />
                        <dd className="truncate">{candidate.email}</dd>
                      </div>
                      {candidate.phone ? (
                        <div className="flex items-center gap-1.5">
                          <dt className="sr-only">Phone</dt>
                          <Phone className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                          <dd>{candidate.phone}</dd>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">CV</dt>
                        <FileText className="h-3.5 w-3.5 text-ink-soft/70" aria-hidden="true" />
                        <dd>{candidate.hasCv ? 'CV on file' : 'No CV yet'}</dd>
                      </div>
                    </dl>

                    {candidate.subjects.length > 0 || candidate.certifications.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {candidate.subjects.map((subject) => (
                          <Badge key={subject} className="bg-plum-50 text-plum-800">
                            {subject}
                          </Badge>
                        ))}
                        {candidate.certifications.slice(0, 3).map((certification) => (
                          <Badge key={certification} className="border border-line bg-paper text-ink-soft">
                            {certification}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Readiness and the one action, aligned in a right column on desktop. */}
                <div className="flex items-center justify-between gap-4 pl-[54px] lg:flex-col lg:items-stretch lg:justify-center lg:gap-3 lg:pl-0">
                  <div className="min-w-0 flex-1 lg:flex-none">
                    <div className="flex items-baseline justify-between gap-2 text-meta text-ink-soft">
                      <span>Profile</span>
                      <span className="tabular font-semibold text-ink">{candidate.profileCompletion}%</span>
                    </div>
                    <div
                      className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"
                      role="progressbar"
                      aria-label="Profile completeness"
                      aria-valuenow={candidate.profileCompletion}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-plum-500"
                        style={{ width: `${Math.min(100, Math.max(0, candidate.profileCompletion))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-meta text-ink-soft/80">
                      Joined {formatRelative(candidate.registeredAt)}
                    </p>
                  </div>
                  {/* Secondary: a page of these should not be a wall of purple. */}
                  <Button variant="secondary" size="sm" onClick={() => setOffering(candidate)}>
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    Offer a role
                  </Button>
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

      {offering ? (
        <OfferRoleDialog candidate={offering} onClose={() => setOffering(null)} />
      ) : null}
    </div>
  );
};
