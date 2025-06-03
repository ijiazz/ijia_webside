import { useAsync } from "@/hooks/async.ts";
import { Spin } from "antd";
import React, { useState, useRef, useCallback, useEffect } from "react";

type InfiniteLoadResult<T, P = unknown> = {
  items: T[];
  hasMore?: boolean;
  nextParam: P;
};
export type InfiniteScrollProps<T = unknown, P = unknown> = {
  loadMore: (param: P) => InfiniteLoadResult<T> | Promise<InfiniteLoadResult<T>>;
  noMoreRender?: React.ReactNode;
  errorRender?: React.ReactNode;
  loadingRender?: React.ReactNode;
  defaultData?: InfiniteLoadResult<T, P> | (() => InfiniteLoadResult<T, P>);
};
export function useInfiniteLoad<T = unknown, P = unknown>(props: InfiniteScrollProps<T, P>): InfiniteLoadResultType<T> {
  const { loadMore, defaultData, errorRender, loadingRender, noMoreRender } = props;
  const [data, setData] = useState<InfiniteLoadResult<T, P> | undefined>(defaultData);

  const { loading, error, run } = useAsync(async () => {
    const res = await loadMore(data?.nextParam as P);
    if (!res) return { items: [], hasMore: false, nextParam: undefined } as any;
    setData((prev): InfiniteLoadResult<T, P> => {
      if (!prev) return res as any;
      return {
        items: prev.items.concat(res.items),
        hasMore: res.hasMore,
        nextParam: res.nextParam as any,
      };
    });
  });

  const observer = useRef<IntersectionObserver>(null);
  const lastInView = useRef<HTMLElement | null>(null);

  const onIntoViewRef = useRef<() => void>(null as any);
  onIntoViewRef.current = () => {
    if (data && !data.hasMore) return;
    run();
  };

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    if (loading) return;
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      const inView = entries.some((item) => item.isIntersecting);
      lastInView.current = node;
      console.log("IntersectionObserver", inView, entries);
      if (inView) onIntoViewRef.current();
    });

    observer.current.observe(node);
  }, []);
  const setDataCore = useCallback((data: T[] | ((old: T[]) => T[])) => {
    if (typeof data === "function") {
      setData((old) => {
        const newData = data(old?.items || []);
        return { ...old, items: newData } as InfiniteLoadResult<T, P>;
      });
    } else {
      setData((old) => ({ ...old, items: data }) as InfiniteLoadResult<T, P>);
    }
  }, []);
  const reset = useCallback(() => {
    setData(undefined);
  }, []);
  useEffect(() => {
    if (lastInView.current && observer.current) {
      const rec = observer.current.takeRecords();
      observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        const inView = entries.some((item) => item.isIntersecting);
        lastInView.current = inView;
        console.log("ccc", inView, entries);
        if (inView) onIntoViewRef.current();
      });
      // observer.current.observe(rec.target);
    }
  }, [data]);

  return {
    loading,
    data: data?.items,
    hasMore: data?.hasMore ?? false,
    setData: setDataCore,
    reset,
    ref: (
      <div
        ref={lastElementRef}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0" }}
      >
        {!data || data.hasMore ? (
          error ? (
            !loading && <div style={{ color: "red" }}>{errorRender ?? "加载失败"}</div>
          ) : (
            <Spin style={{ visibility: loading ? "visible" : "hidden" }}>{loadingRender ?? "加载中"}</Spin>
          )
        ) : (
          (noMoreRender ?? "没有更多数据")
        )}
      </div>
    ),
  };
}

export type InfiniteLoadResultType<T> = {
  ref: React.ReactElement;
  data: T[] | undefined;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  reset: () => void;
  hasMore: boolean;
  loading: boolean;
};

/* 


- 加载一组数据后如果触发器仍可见，且仍有数据，则继续加载
- 数据不在加载装固态，触发器从不可见状态移动到可见是，如果仍有数据，则触发加载
- 数据在加载装状态，触发器可见状态变化不会触发加载
- 没有更多数据，触发器可见状态变化不会触发加载

*/
