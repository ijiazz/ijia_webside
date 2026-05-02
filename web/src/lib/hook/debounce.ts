import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  const ref = useRef({
    fn,
    delay,
  });
  ref.current.fn = fn;
  ref.current.delay = delay;

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay],
  );
}

export function useDebounceValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
