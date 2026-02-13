import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";

export type InfiniteLoadResult<T, P> = { items: T[]; nextParam: P | undefined; prevParam: P | undefined };
export type LoadMoreContext<T> = { param?: T; isNext: boolean };
export type UseInfiniteLoadOption<T, Param> = {
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

export function useInfiniteLoad<T, Param>(option: UseInfiniteLoadOption<T, Param>): UseInfiniteDataResult<T> {
  const [nextStatus, setNextStatus] = useState<LoadStatus<Param>>(getDefaultParam);
  const [prevStatus, setPrevStatus] = useState<LoadStatus<Param>>(getDefaultParam);
  const optionRef = useRef(option);
  optionRef.current = option;
  const loadRef = useRef<RefState<Param>>({ next: {}, prev: {}, isFirst: true });

  const [items, setItems] = useState<T[]>([]);

  const loadMore = useCallback((isNext: boolean): Promise<void> => {
    let onAdd: (typeof option)["onPush"];
    let setStatus: typeof setNextStatus;
    const load = optionRef.current.load;
    let ref: typeof loadRef.current.next;

    if (isNext) {
      setStatus = setNextStatus;
      ref = loadRef.current.next;
      onAdd = optionRef.current.onPush;
    } else {
      setStatus = setPrevStatus;
      ref = loadRef.current.prev;
      onAdd = optionRef.current.onUnshift;
    }
    if (!loadRef.current.isFirst && ref.param === undefined) return Promise.resolve();

    if (ref.promise) {
      return ref.promise;
    }
    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    const promise = load(ref.param, !isNext).then(
      (res) => {
        if (ref.promise !== promise) return; // rest 时可能已经发起了新的请求，当前请求结果不再处理
        const loadTargetRef = loadRef.current;
        if (loadTargetRef.isFirst) {
          loadTargetRef.isFirst = false;
          loadTargetRef.next.param = res.nextParam;
          loadTargetRef.prev.param = res.prevParam;
          setNextStatus({ error: null, hasMore: res.nextParam !== undefined, loading: false });
          setPrevStatus({ error: null, hasMore: res.prevParam !== undefined, loading: false });
        } else {
          const param = isNext ? res.nextParam : res.prevParam;
          ref.param = param;
          setStatus({ error: null, hasMore: param !== undefined, loading: false });
        }
        ref.promise = undefined;
        if (res.items.length) {
          onAdd(res.items);
        }
      },
      (error) => {
        if (ref.promise !== promise) return; // rest 时可能已经发起了新的请求，当前请求结果不再处理
        setStatus((prev) => ({ ...prev, loading: false, error }));
        ref.promise = undefined;
      },
    );
    ref.promise = promise;
    return promise;
  }, []);

  return {
    data: items,
    setData: setItems,
    reset: () => {
      loadRef.current = { next: {}, prev: {}, isFirst: true };
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
type RefState<T> = { readonly next: RefStateItem<T>; readonly prev: RefStateItem<T>; isFirst: boolean };
type RefStateItem<T> = {
  param?: T;
  promise?: Promise<void>;
};
type LoadStatus<T> = {
  loading: boolean;
  error: unknown;
  hasMore: boolean;
};

function getDefaultParam<Param>(): LoadStatus<Param> {
  return {
    loading: false,
    error: null,
    hasMore: true,
  };
}
