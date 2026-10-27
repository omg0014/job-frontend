/**
 * Minimal class-name joiner. Keeps conditional Tailwind classes readable
 * without pulling in a dependency for string concatenation.
 */
export const clsx = (...values) =>
  values
    .flat()
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ');
