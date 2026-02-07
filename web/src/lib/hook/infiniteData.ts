import { Dispatch, SetStateAction, useCallback, useRef, useState, useEffect, useMemo } from "react";

export type InfiniteLoadResult<T, P> = { items: T[]; nextParam: P | undefined; prevParam: P | undefined };
export type LoadMoreContext<T> = { param?: T; isNext: boolean };
export type UseInfiniteDataOption<T, Param> = {
  onPush: (items: T[]) => void;
  onUnshift: (items: T[]) => void;
  load: (param: Param | undefined, forward: boolean) => Promise<InfiniteLoadResult<T, Param>>;
};

export type UseInfiniteDataResult<T> = {
  data: T[];
  setData: Dispatch<SetStateAction<T[]>>;
  reset: () => void;
  next: UserPageDataResult;
  previous: UserPageDataResult;
  error: unknown;
  loading: boolean;
};

type UserPageDataResult = {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  error: unknown;
  loading: boolean;
};

type LoadStatus = {
  loading: boolean;
  error: unknown;
  hasMore: boolean;
};

export function useInfiniteData<T, Param>(option: UseInfiniteDataOption<T, Param>): UseInfiniteDataResult<T> {
  const optionRef = useRef(option);
  optionRef.current = option;
  const nextRef = useRef<{
    readonly next: { param?: Param; promise?: Promise<void> };
    readonly prev: { param?: Param; promise?: Promise<void> };
    isFirst: boolean;
  }>({ next: {}, prev: {}, isFirst: true });
  const [nextStatus, setNextStatus] = useState<LoadStatus>({ loading: false, error: null, hasMore: true });
  const [prevStatus, setPrevStatus] = useState<LoadStatus>({ loading: false, error: null, hasMore: true });

  const [items, setItems] = useState<T[]>([]);

  const loadMore = useCallback((isNext: boolean) => {
    let onAdd: (typeof option)["onPush"];
    let setStatus: typeof setNextStatus;
    const load = optionRef.current.load;
    let ref: typeof nextRef.current.next | typeof nextRef.current.prev;
    if (isNext) {
      setStatus = setNextStatus;
      ref = nextRef.current.next;
      onAdd = optionRef.current.onPush;
    } else {
      setStatus = setPrevStatus;
      ref = nextRef.current.prev;
      onAdd = optionRef.current.onUnshift;
    }
    if (ref.promise) {
      return ref.promise;
    }
    setStatus({ loading: true, error: null, hasMore: true });
    ref.promise = load(ref.param, !isNext).then(
      (res) => {
        const promiseRef = nextRef.current;
        if (promiseRef.isFirst) {
          promiseRef.next.param = res.nextParam;
          promiseRef.prev.param = res.prevParam;
          setNextStatus({ error: null, hasMore: res.nextParam === undefined, loading: false });
          setPrevStatus({ error: null, hasMore: res.nextParam === undefined, loading: false });
        } else {
          const param = isNext ? res.nextParam : res.prevParam;
          ref.param = param;
          setStatus({ error: null, hasMore: param === undefined, loading: false });
        }
        ref.promise = undefined;

        onAdd(res.items);
      },
      (error) => {
        setStatus({ error, hasMore: true, loading: false });
        ref.promise = undefined;
      },
    );

    return ref.promise;
  }, []);

  return {
    data: items,
    setData: setItems,
    reset: () => {
      nextRef.current = { next: {}, prev: {}, isFirst: true };
      setNextStatus({ loading: false, error: null, hasMore: true });
      setPrevStatus({ loading: false, error: null, hasMore: true });
      setItems([]);
    },
    error: nextStatus.error || prevStatus.error,
    loading: nextStatus.loading || prevStatus.loading,
    next: {
      error: nextStatus.error,
      hasMore: nextStatus.hasMore,
      loading: nextStatus.loading,
      loadMore: () => loadMore(true),
    },
    previous: {
      error: prevStatus.error,
      hasMore: prevStatus.hasMore,
      loading: prevStatus.loading,
      loadMore: () => loadMore(false),
    },
  };
}
