import { useAsync } from "@/hooks/async.ts";
import { Spin } from "antd";
import React, { useState, useRef, useCallback } from "react";

type InfiniteLoadResult<T, P = unknown> = {
  items: T[];
  hasMore?: boolean;
  nextParam: P;
};
export type InfiniteScrollProps<T = unknown, P = unknown> = {
  loadMore: (param: P) => InfiniteLoadResult<T> | Promise<InfiniteLoadResult<T>>;
  noMoreDataRender?: React.ReactNode;
  errorDataRender?: React.ReactNode;
  loadingDataRender?: React.ReactNode;
  defaultData?: InfiniteLoadResult<T, P> | (() => InfiniteLoadResult<T, P>);
};
export function useInfiniteLoad<T = unknown, P = unknown>(
  props: InfiniteScrollProps<T, P>,
): InfiniteLoadResultType<T, P> {
  const { loadMore, defaultData } = props;
  const [data, setData] = useState<InfiniteLoadResult<T, P> | undefined>(defaultData);

  const { reset, result, run } = useAsync(async () => {
    const res = await loadMore(data?.nextParam as P);
    if (!res) return { items: [], hasMore: false, nextParam: undefined } as any;

    setData((prev): InfiniteLoadResult<T, P> => {
      if (!prev) return res as any;
      return {
        items: [...prev.items, ...res.items],
        hasMore: res.hasMore,
        nextParam: res.nextParam as any,
      };
    });
  });
  const loading = result.loading;

  const observer = useRef<IntersectionObserver>(null);

  const onIntoViewRef = useRef<() => void>(null as any);
  onIntoViewRef.current = () => {
    if (data && !data.hasMore) return;
    run();
  };

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onIntoViewRef.current();
    });
    observer.current.observe(node);
  }, []);

  return {
    loading,
    data: data?.items,
    hasMore: data?.hasMore ?? false,
    error: result.error,
    setData,
    ref: (
      <>
        <div ref={lastElementRef}></div>
        {!data || data.hasMore ? (
          result.error ? (
            !loading && (
              <div style={{ margin: "12px auto", textAlign: "center", color: "red" }}>
                加载失败: {result.error.message}
              </div>
            )
          ) : (
            (!result.error || loading) && (
              <Spin>
                <div style={{ margin: "12px auto " }}>加载中</div>
              </Spin>
            )
          )
        ) : (
          <div>没有更多数据</div>
        )}
      </>
    ),
  };
}
export type InfiniteLoadResultType<T, P = unknown> = {
  ref: React.ReactElement;
  data: T[] | undefined;
  setData: React.Dispatch<React.SetStateAction<InfiniteLoadResult<T, P> | undefined>>;
  hasMore: boolean;
  loading: boolean;
  error?: Error;
};
type Mt<T> = {
  unshift(data: T[]): void;
  push(data: T[]): void;
  update(data: T[]): void;
};
