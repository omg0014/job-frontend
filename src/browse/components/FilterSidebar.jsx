import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '../ui/Checkbox.jsx';
import { Slider } from '../ui/Slider.jsx';
import { Button } from '../ui/Button.jsx';
import { cn } from '../lib/cn.js';
import { ROLE_TYPES, EXPERIENCE_LEVELS, WORK_MODES, TECH_TAGS } from '../data/jobs.js';

/** Collapsible group. Native <details> would not animate, so this is explicit. */
const FilterGroup = ({ title, children, defaultOpen = true, count }) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = `filter-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="border-b border-ink-200 pb-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          'flex w-full items-center justify-between rounded-control py-2 text-left',
          'transition-colors duration-150 ease-out hover:text-purple-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        )}
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold tracking-heading text-ink-900">
          {title}
          {count > 0 ? (
            <span className="rounded-full bg-purple-100 px-1.5 py-px text-[10px] font-semibold text-purple-800">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-ink-400 transition-transform duration-200 ease-out',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const CheckRow = ({ label, checked, onChange, hint }) => {
  const id = `check-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center gap-3 py-[7px]">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-center justify-between text-[13px] text-ink-700 hover:text-ink-900"
      >
        {label}
        {hint ? <span className="text-[11px] text-ink-500">{hint}</span> : null}
      </label>
    </div>
  );
};

export const FilterSidebar = ({ filters, setFilters, onReset, activeCount, resultCount }) => {
  const toggleIn = (key, value) =>
    setFilters((previous) => ({
      ...previous,
      [key]: previous[key].includes(value)
        ? previous[key].filter((item) => item !== value)
        : [...previous[key], value],
    }));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold tracking-heading text-ink-900">Filters</h2>
        <AnimatePresence>
          {activeCount > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
            >
              <Button variant="ghost" size="sm" onClick={onReset} className="-mr-2 h-7 gap-1 px-2 text-xs">
                <X className="h-3 w-3" aria-hidden="true" />
                Clear all
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <FilterGroup title="Role type" count={filters.roleTypes.length}>
        {ROLE_TYPES.map((type) => (
          <CheckRow
            key={type}
            label={type}
            checked={filters.roleTypes.includes(type)}
            onChange={() => toggleIn('roleTypes', type)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Experience" count={filters.expLevels.length}>
        {EXPERIENCE_LEVELS.map((level) => (
          <CheckRow
            key={level.id}
            label={level.label}
            checked={filters.expLevels.includes(level.id)}
            onChange={() => toggleIn('expLevels', level.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Salary range">
        <div className="px-0.5 pb-1 pt-3">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ink-900">
              {filters.salary[0]}–{filters.salary[1]} LPA
            </span>
            {filters.salary[1] >= 80 ? (
              <span className="text-[11px] text-ink-500">80+ included</span>
            ) : null}
          </div>
          <Slider
            value={filters.salary}
            onValueChange={(salary) => setFilters((previous) => ({ ...previous, salary }))}
            min={0}
            max={80}
            step={2}
            minStepsBetweenThumbs={1}
            aria-label="Salary range in lakhs per annum"
          />
          <div className="mt-2 flex justify-between text-[11px] text-ink-500">
            <span>0</span>
            <span>80+ LPA</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Work mode" count={filters.workModes.length}>
        {WORK_MODES.map((mode) => (
          <CheckRow
            key={mode}
            label={mode}
            checked={filters.workModes.includes(mode)}
            onChange={() => toggleIn('workModes', mode)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Tech stack" count={filters.tags.length}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {TECH_TAGS.map((tag) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleIn('tags', tag)}
                aria-pressed={active}
                className={cn(
                  'rounded-md border px-2 py-1 text-[12px] font-medium',
                  'transition-[background-color,border-color,color] duration-150 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                  active
                    ? 'border-purple-700 bg-purple-700 text-white'
                    : 'border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:bg-ink-50',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <p className="pt-3 text-[11px] text-ink-500" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'job' : 'jobs'} match
      </p>
    </div>
  );
};
