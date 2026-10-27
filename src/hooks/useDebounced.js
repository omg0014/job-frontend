import { useEffect, useState } from 'react';

/**
 * Debounces a fast-changing value (a search box) so filter changes do not
 * trigger a request per keystroke.
 */
export const useDebounced = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
