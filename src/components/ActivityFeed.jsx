import { Briefcase, Users, UserCog, LogIn, Activity } from 'lucide-react';
import { Badge } from './ui.jsx';
import { formatRelative, formatDateTime } from '../lib/format.js';
import { ROLE_BADGES, ROLE_LABELS } from '../lib/roles.js';

const CATEGORY_ICONS = {
  job: Briefcase,
  applicant: Users,
  account: UserCog,
  auth: LogIn,
};

const CATEGORY_TINTS = {
  job: 'bg-plum-50 text-plum-600',
  applicant: 'bg-gold-50 text-gold-700',
  account: 'bg-plum-50 text-plum-600',
  auth: 'bg-paper text-ink-soft',
};

/**
 * One activity entry. Shows who did it and when, so an admin reading a
 * principal's log can tell at a glance whether the principal acted or one of
 * their recruiters did.
 */
export const ActivityRow = ({ entry, showActor = true, as: Tag = 'li', className = '' }) => {
  const Icon = CATEGORY_ICONS[entry.category] ?? Activity;

  return (
    <Tag className={`flex gap-3 py-3 ${className}`}>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          CATEGORY_TINTS[entry.category] ?? 'bg-paper text-ink-soft'
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-ui leading-snug text-ink">
          {showActor ? (
            <>
              <span className="font-semibold text-ink">{entry.actorName}</span>{' '}
            </>
          ) : null}
          {entry.summary}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          {showActor ? (
            <Badge
              className={`${ROLE_BADGES[entry.actorRole] ?? ''} !px-1.5 !py-0 !text-[10px]`}
            >
              {ROLE_LABELS[entry.actorRole] ?? entry.actorRole}
            </Badge>
          ) : null}
          <time
            className="text-meta text-ink-soft"
            dateTime={entry.createdAt}
            title={formatDateTime(entry.createdAt)}
          >
            {formatRelative(entry.createdAt)}
          </time>
        </div>
      </div>
    </Tag>
  );
};

/** "Today", "Yesterday", or the date — how people actually talk about a log. */
const dayLabel = (value) => {
  const date = new Date(value);
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(new Date()) - startOf(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
};

const groupByDay = (entries) => {
  const groups = [];
  for (const entry of entries) {
    const label = dayLabel(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }
  return groups;
};

/**
 * Three layouts for the same data:
 *
 *   'list' — a divided list inside one card, for the compact feeds embedded in
 *            a drawer or dashboard panel.
 *   'grid' — each entry as its own card, two per row on desktop and one per
 *            row on mobile.
 *   'grouped' — one card, entries under a quiet heading per day, for the
 *            full activity page where the log is read as a timeline.
 */
export const ActivityFeed = ({ entries, showActor = true, emptyMessage, variant = 'list' }) => {
  if (entries.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-ui text-ink-soft">
        {emptyMessage ?? 'No activity recorded yet.'}
      </p>
    );
  }

  if (variant === 'grouped') {
    return (
      <div className="overflow-hidden rounded-card border border-line/80 bg-field shadow-card">
        {groupByDay(entries).map((group) => (
          <section key={group.label} aria-label={group.label} className="border-t border-line first:border-t-0">
            <h3 className="border-b border-line bg-paper/70 px-4 py-2 text-meta font-semibold text-ink-soft sm:px-5">
              {group.label}
            </h3>
            <ul className="divide-y divide-line">
              {group.entries.map((entry) => (
                <ActivityRow key={entry._id} entry={entry} showActor={showActor} className="px-4 sm:px-5" />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <ul className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        {entries.map((entry) => (
          <li key={entry._id}>
            <div className="h-full rounded-card border border-line/80 bg-field shadow-card px-4">
              {/* Rendered as a div here — the <li> is the grid cell above. */}
              <ActivityRow entry={entry} showActor={showActor} as="div" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <ActivityRow key={entry._id} entry={entry} showActor={showActor} />
      ))}
    </ul>
  );
};
