import { useEffect, useState } from "react";

/**
 * A copy of `value` that only updates after it has stopped changing for `delay` milliseconds. Use it
 * to wait out typing before searching: render with the live value, query with the debounced one. The
 * first render returns the value straight away.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
