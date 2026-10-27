/** Salaries always read in the LPA convention: "12–18 LPA". */
export const formatLpa = (min, max) =>
  min === max ? `${min} LPA` : `${min}–${max} LPA`;

export const formatExperience = (min, max) => {
  if (max <= 1) return 'Fresher';
  if (min === 0) return `Up to ${max} yrs`;
  return `${min}–${max} yrs`;
};

/** Coarse relative time — a job board never needs second precision. */
export const formatPostedAt = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

/** Company monogram tints — warm-leaning, never fighting the purple accent. */
export const LOGO_TONES = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  slate: 'bg-ink-100 text-ink-700 ring-ink-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  pink: 'bg-pink-50 text-pink-700 ring-pink-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  purple: 'bg-purple-50 text-purple-800 ring-purple-100',
};
