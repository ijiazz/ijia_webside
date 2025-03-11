import { useCallback, useEffect, useRef, useState } from "react";

export type UseAsyncResult<T, A extends any[]> = {
  run(...args: A): Promise<T>;
  reset(result?: T, error?: any): void;
  result: AsyncResult<T>;
};
export type UserAsyncOption<T, Args extends any[] = []> = {
  autoRunArgs?: Args;
  defaultState?: AsyncResult<T>;
};
type AsyncResult<T> = {
  loading: boolean;
  error?: any;
  value?: T;
};
export function useAsync<T, Args extends any[] = []>(
  fn: (...args: Args) => Promise<T> | T,
  option: UserAsyncOption<T, Args> = {},
): UseAsyncResult<T, Args> {
  const { defaultState = { loading: false }, autoRunArgs } = option;
  const [result, setResult] = useState<AsyncResult<T>>(defaultState);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const loadingPromise = useRef<Promise<any>>(undefined);
  const run = useCallback((...args: Args) => {
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
          if (result.error) throw result.error;
        });
      return promise;
    } else {
      loadingPromise.current = undefined;
      setResult({ value: promise, loading: false });
    }
    return Promise.resolve(promise);
  }, []);

  useEffect(() => {
    if (autoRunArgs) run.apply(undefined, autoRunArgs);
    return () => {
      loadingPromise.current = undefined;
    };
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
