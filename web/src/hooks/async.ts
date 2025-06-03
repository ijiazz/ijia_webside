import { useCallback, useEffect, useRef, useState } from "react";

export type UseAsync<T, A extends any[]> = {
  run(...args: A): Promise<T>;
  reset(result?: T, error?: any): void;
  loading: boolean;
  error?: any;
  data?: T;
  /** @deprecated 已废弃 */
  result: UseAsyncResult<T>;
};
export type UserAsyncOption<T, Args extends any[] = []> = {
  autoRunArgs?: Args;
  defaultState?: UseAsyncResult<T>;
};
export type UseAsyncResult<T> = {
  loading: boolean;
  error?: any;
  value?: T;
};
export function useAsync<T, Args extends any[] = []>(
  fn: (...args: Args) => Promise<T> | T,
  option: UserAsyncOption<T, Args> = {},
): UseAsync<T, Args> {
  const { defaultState = { loading: false }, autoRunArgs } = option;
  const [result, setResult] = useState<UseAsyncResult<T>>(defaultState);

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
          (res): UseAsyncResult<T> => {
            return { value: res, error: undefined, loading: false };
          },
          (error): UseAsyncResult<T> => {
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
  const reset = useCallback((result: T, error: any) => {
    loadingPromise.current = undefined;
    setResult({ error, loading: false, value: result });
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
    result,
    loading: result.loading, //TODO 将 loading 状态拆分
    error: result.error,
    data: result.value,
  };
}
