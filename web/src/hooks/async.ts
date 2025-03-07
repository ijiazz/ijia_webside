import { useCallback, useRef, useState } from "react";

export type UseAsyncResult<T, A extends any[]> = {
  run(...args: A): Promise<T>;
  reset(result?: T, error?: any): void;
  result: AsyncResult<T>;
};
type AsyncResult<T> = {
  loading: boolean;
  error?: any;
  value?: T;
};
export function useAsync<T, A extends any[] = []>(
  fn: (...args: A) => Promise<T> | T,
  option: {
    defaultLoading?: boolean;
    defaultError?: boolean;
    defaultResult?: T;
  } = {},
): UseAsyncResult<T, A> {
  const [result, setResult] = useState<AsyncResult<T>>({
    error: option.defaultError,
    value: option.defaultResult,
    loading: option.defaultLoading ?? false,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const loadingPromise = useRef<Promise<any>>(undefined);

  const run = useCallback((...args: A) => {
    const promise = fnRef.current(...args);
    if (promise instanceof Promise) {
      setResult((res) => ({ ...res, loading: true }));
      loadingPromise.current = promise;
      promise
        .then(
          (res): AsyncResult<T> => {
            return { value: res, error: undefined, loading: false };
          },
          (error): AsyncResult<T> => {
            return { error, value: undefined, loading: false };
          },
        )
        .then((result) => {
          const symbol = loadingPromise.current;
          if (symbol === promise || symbol === undefined) {
            setResult(result);
            loadingPromise.current = undefined;
          }
        });
      return promise;
    } else {
      loadingPromise.current = undefined;
      setResult({ value: promise, loading: false });
    }
    return Promise.resolve(promise);
  }, []);
  return {
    reset: (result, error) => {
      loadingPromise.current = undefined;
      setResult({ error, loading: false, value: result });
    },
    run,
    result,
  };
}
