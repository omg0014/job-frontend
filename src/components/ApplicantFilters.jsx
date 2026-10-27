import { Search } from 'lucide-react';
import { Toolbar } from './ui.jsx';
import { Field, Input, Select } from './form.jsx';
import { APPLICATION_STATUS } from '../lib/constants.js';

/** Shared filter bar for the two admin applicant views. */
export const ApplicantFilters = ({ values, onChange, subjects = [] }) => (
  <Toolbar>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
      <Field label="Search" htmlFor="applicant-q">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/70"
            aria-hidden="true"
          />
          <Input
            id="applicant-q"
            value={values.q}
            onChange={(event) => onChange('q', event.target.value)}
            placeholder="Name, email, skill…"
            className="pl-9"
          />
        </div>
      </Field>

      <Field label="Status" htmlFor="applicant-status">
        <Select
          id="applicant-status"
          value={values.status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(APPLICATION_STATUS).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subject" htmlFor="applicant-subject">
        <Select
          id="applicant-subject"
          value={values.subject}
          onChange={(event) => onChange('subject', event.target.value)}
        >
          <option value="">Any subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Minimum experience" htmlFor="applicant-minExp">
        <Select
          id="applicant-minExp"
          value={values.minExp}
          onChange={(event) => onChange('minExp', event.target.value)}
        >
          <option value="">Any</option>
          {[1, 2, 3, 5, 8, 10, 15].map((years) => (
            <option key={years} value={years}>
              {years}+ years
            </option>
          ))}
        </Select>
      </Field>
    </div>
  </Toolbar>
);
