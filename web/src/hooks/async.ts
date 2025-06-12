import { useCallback, useEffect, useRef, useState } from "react";

export type UseAsync<T, A extends any[]> = {
  run(...args: A): Promise<T>;
  reset(result?: T, error?: any): void;
  loading: boolean;
  error?: any;
  data?: T;
};
export type UserAsyncOption<T, Args extends any[] = []> = {
  autoRunArgs?: Args;
  defaultResult?: T;
  defaultError?: any;
};
type UseAsyncResult<T> = {
  error?: any;
  value?: T;
};
export function useAsync<T, Args extends any[] = []>(
  fn: (...args: Args) => Promise<T> | T,
  option: UserAsyncOption<T, Args> = {},
): UseAsync<T, Args> {
  const { defaultError, defaultResult, autoRunArgs } = option;
  const [result, setResult] = useState<UseAsyncResult<T>>({ value: defaultResult, error: defaultError });
  const [loading, setLoading] = useState(autoRunArgs ? true : false);

  const fnRef = useRef(fn);
  fnRef.current = fn;
  const loadingPromise = useRef<Promise<any>>(undefined);
  const run = useCallback((...args: Args) => {
    const promise = fnRef.current(...args);
    if (promise instanceof Promise) {
      setLoading(true);
      loadingPromise.current = promise;
      promise
        .then(
          (res): UseAsyncResult<T> => {
            return { value: res, error: undefined };
          },
          (error): UseAsyncResult<T> => {
            return { error, value: undefined };
          },
        )
        .then((result) => {
          const symbol = loadingPromise.current;
          if (symbol === promise || symbol === undefined) {
            setLoading(false);
            setResult(result);
            loadingPromise.current = undefined;
          }
          if (result.error) throw result.error;
        });
      return promise;
    } else {
      loadingPromise.current = undefined;
      setResult({ value: promise });
      return Promise.resolve(promise);
    }
  }, []);
  const reset = useCallback((result: T, error: any) => {
    loadingPromise.current = undefined;
    setResult({ error, value: result });
    setLoading(false);
  }, []);
  useEffect(() => {
    if (autoRunArgs) run.apply(undefined, autoRunArgs);
    return () => {
      loadingPromise.current = undefined;
    };
  }, []);
  return {
    reset,
    run,
    loading: loading,
    error: result.error,
    data: result.value,
  };
}
