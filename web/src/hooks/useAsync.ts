import { useCallback, useRef, useState } from "react";

export type UseAsyncResult<T, A extends any[]> = AsyncInfo<T> & {
  run(...args: A): Promise<T>;
  loading: boolean;
};
type AsyncInfo<T> = {
  error?: unknown;
  result?: T;
};
export function useAsync<T, A extends any[] = []>(
  fn: (...args: A) => Promise<T> | T,
  option: {
    defaultLoading?: boolean;
    defaultError?: boolean;
    defaultResult?: T;
  } = {},
): UseAsyncResult<T, A> {
  const [loading, setLoading] = useState(option.defaultLoading ?? false);
  const [responseData, setResponseData] = useState<AsyncInfo<T>>({
    error: option.defaultError,
    result: option.defaultResult,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const loadingPromise = useRef<Promise<any>>(undefined);

  const run = useCallback((...args: A) => {
    const promise = fnRef.current(...args);
    if (promise instanceof Promise) {
      setLoading(true);
      loadingPromise.current = promise;
      promise
        .then(
          (res) => {
            return { result: res, error: undefined };
          },
          (error) => {
            return { error, result: undefined };
          },
        )
        .then((result) => {
          const symbol = loadingPromise.current;
          if (symbol === promise || symbol === undefined) {
            setResponseData(result);
            setLoading(false);
            loadingPromise.current = undefined;
          }
        });
      return promise;
    } else {
      loadingPromise.current = undefined;
      setLoading(false);
      setResponseData({ result: promise });
    }
    return Promise.resolve(promise);
  }, []);
  return {
    run,
    loading: loading,
    error: responseData.error,
    result: responseData.result,
  };
}
