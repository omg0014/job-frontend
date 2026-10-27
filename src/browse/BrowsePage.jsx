import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { TopNav } from './components/TopNav.jsx';
import { FilterSidebar } from './components/FilterSidebar.jsx';
import { JobCard } from './components/JobCard.jsx';
import { JobListSkeleton } from './components/JobCardSkeleton.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { JobDetailPanel } from './components/JobDetailPanel.jsx';
import { SortMenu } from './components/SortMenu.jsx';
import { SalaryInsights } from './components/SalaryInsights.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { cn } from './lib/cn.js';
import { listContainer, backdropFade, panelSpring } from './lib/motion.js';
import { JOBS, EXPERIENCE_LEVELS } from './data/jobs.js';

const EMPTY_FILTERS = {
  roleTypes: [],
  expLevels: [],
  salary: [0, 80],
  workModes: [],
  tags: [],
};

const countActive = (filters) =>
  filters.roleTypes.length +
  filters.expLevels.length +
  filters.workModes.length +
  filters.tags.length +
  (filters.salary[0] !== 0 || filters.salary[1] !== 80 ? 1 : 0);

export const BrowsePage = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('relevance');
  const [saved, setSaved] = useState(() => new Set(['j-03']));
  const [activeJobId, setActiveJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // One initial load so the skeleton state is real rather than hypothetical.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = JOBS.filter((job) => {
      if (q) {
        const haystack = [job.title, job.company, job.location, ...job.tags]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (filters.roleTypes.length && !filters.roleTypes.includes(job.roleType)) return false;
      if (filters.workModes.length && !filters.workModes.includes(job.workMode)) return false;

      if (filters.tags.length && !filters.tags.some((tag) => job.tags.includes(tag))) {
        return false;
      }

      // A job matches a band if its range overlaps that band at all.
      if (filters.expLevels.length) {
        const matches = filters.expLevels.some((id) => {
          const level = EXPERIENCE_LEVELS.find((entry) => entry.id === id);
          return level && job.expMin <= level.max && job.expMax >= level.min;
        });
        if (!matches) return false;
      }

      const [minSalary, maxSalary] = filters.salary;
      if (job.salaryMax < minSalary) return false;
      if (maxSalary < 80 && job.salaryMin > maxSalary) return false;

      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case 'salary-desc':
        sorted.sort((a, b) => b.salaryMax - a.salaryMax);
        break;
      case 'salary-asc':
        sorted.sort((a, b) => a.salaryMin - b.salaryMin);
        break;
      case 'applicants':
        sorted.sort((a, b) => a.applicants - b.applicants);
        break;
      default:
        // Relevance: featured first, then most recent.
        sorted.sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return new Date(b.postedAt) - new Date(a.postedAt);
        });
    }

    return sorted;
  }, [filters, query, sort]);

  const activeJob = results.find((job) => job.id === activeJobId)
    ?? JOBS.find((job) => job.id === activeJobId)
    ?? null;

  const activeCount = countActive(filters);

  const toggleSave = (jobId) =>
    setSaved((previous) => {
      const next = new Set(previous);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  // Close the mobile sheet once a filter narrows things down enough to see.
  useEffect(() => {
    if (mobileFiltersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  return (
    // reducedMotion="user" makes every Framer transform respect the OS setting.
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-canvas font-sans text-ink-900 antialiased">
        <TopNav query={query} onQueryChange={setQuery} savedCount={saved.size} />

        <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-6 sm:px-6 lg:gap-10 lg:py-8">
          <aside className="hidden w-[228px] shrink-0 lg:block">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
                activeCount={activeCount}
                resultCount={results.length}
              />
            </div>
          </aside>

          {/* Capped so a card line never runs past a comfortable measure. */}
          <main id="main" className="min-w-0 flex-1 lg:max-w-[760px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[22px] font-semibold leading-tight tracking-tighter2 text-ink-900">
                  {query ? `Results for “${query}”` : 'Open roles'}
                </h1>
                <p className="mt-1 text-[13px] text-ink-500" aria-live="polite">
                  {loading
                    ? 'Finding roles…'
                    : `${results.length} ${results.length === 1 ? 'job' : 'jobs'}${
                        activeCount > 0 ? ' after filters' : ''
                      }`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 lg:hidden"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  Filters
                  {activeCount > 0 ? (
                    <span className="ml-0.5 rounded-full bg-purple-700 px-1.5 text-[10px] font-semibold text-white">
                      {activeCount}
                    </span>
                  ) : null}
                </Button>
                <SortMenu value={sort} onChange={setSort} />
              </div>
            </div>

            {/* Active filter chips — a visible, removable record of the query. */}
            <AnimatePresence initial={false}>
              {activeCount > 0 && !loading ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {[...filters.roleTypes, ...filters.workModes, ...filters.tags].map((value) => (
                      <Badge key={value} variant="purple" className="gap-1 pr-1">
                        {value}
                        <button
                          type="button"
                          onClick={() =>
                            setFilters((previous) => ({
                              ...previous,
                              roleTypes: previous.roleTypes.filter((item) => item !== value),
                              workModes: previous.workModes.filter((item) => item !== value),
                              tags: previous.tags.filter((item) => item !== value),
                            }))
                          }
                          aria-label={`Remove ${value} filter`}
                          className="rounded p-0.5 hover:bg-purple-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-700"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {!loading && results.length >= 3 ? (
              <div className="mb-5">
                <SalaryInsights jobs={results} />
              </div>
            ) : null}

            {loading ? (
              <JobListSkeleton count={5} />
            ) : results.length === 0 ? (
              <EmptyState onReset={resetFilters} hasFilters={activeCount > 0 || Boolean(query)} />
            ) : (
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {/* `popLayout` lets removed cards leave while the rest reflow,
                    so filtering reads as motion rather than a snap. */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {results.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      saved={saved.has(job.id)}
                      onToggleSave={() => toggleSave(job.id)}
                      onOpen={() => setActiveJobId(job.id)}
                      isActive={activeJobId === job.id}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>

        {/* Mobile filter sheet */}
        <AnimatePresence>
          {mobileFiltersOpen ? (
            <>
              <motion.div
                variants={backdropFade}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={() => setMobileFiltersOpen(false)}
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-ink-900/25 backdrop-blur-[2px] lg:hidden"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={panelSpring}
                className={cn(
                  'fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col bg-surface shadow-panel lg:hidden',
                )}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-ink-200 px-4 py-3.5">
                  <h2 className="text-sm font-semibold tracking-heading text-ink-900">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Close filters"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-500 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    onReset={resetFilters}
                    activeCount={activeCount}
                    resultCount={results.length}
                  />
                </div>

                <div className="shrink-0 border-t border-ink-200 p-4">
                  <Button className="w-full" size="lg" onClick={() => setMobileFiltersOpen(false)}>
                    Show {results.length} {results.length === 1 ? 'job' : 'jobs'}
                  </Button>
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <JobDetailPanel
          job={activeJob}
          saved={activeJob ? saved.has(activeJob.id) : false}
          onToggleSave={() => activeJob && toggleSave(activeJob.id)}
          onClose={() => setActiveJobId(null)}
        />
      </div>
    </MotionConfig>
  );
};
