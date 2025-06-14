import { Button, Spin } from "antd";
import React, { useState, useRef, useCallback, useEffect, useImperativeHandle } from "react";

export type InfiniteLoadResult<T, P = unknown> = {
  items: T[];
  hasMore?: boolean;
  /** 下次调用 loadMore() 是的参数 */
  nextParam: P;
};
export type InfiniteScrollHandle<P = unknown> = {
  reset(): void;
  nextParam?: P;
};
export type InfiniteScrollLoadProps<T = unknown, P = unknown> = {
  loadMore: (param: P | undefined, signal: AbortSignal) => Promise<InfiniteLoadResult<T>>;
  /** 数据加载完成时触发提交 */
  onPush?: (data: T[]) => void;
  /** 滚动距离底部多少像素时触发滚动，如果不设定，则需要手动加载 */
  bottomThreshold?: number;
  noMoreRender?: React.ReactNode;
  errorRender?: React.ReactNode;
  loadingRender?: React.ReactNode;
  children?: React.ReactNode;
  ref?: React.RefObject<InfiniteScrollHandle | null>;

  footerStyle?: React.CSSProperties;
  footerClassName?: string;

  style?: React.CSSProperties;
  className?: string;
};
export function InfiniteScrollLoad<T = unknown, P = unknown>(props: InfiniteScrollLoadProps<T, P>) {
  const {
    loadMore,
    onPush,
    errorRender,
    loadingRender,
    noMoreRender,
    bottomThreshold,
    children,
    footerClassName,
    footerStyle,
    className,
    style,
  } = props;
  const bottomAutoLoad = bottomThreshold !== undefined && bottomThreshold > 0;
  useImperativeHandle(props.ref, () => {
    return ref;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hasMore: boolean; error?: boolean }>({ hasMore: true });
  const { current: ref } = useRef<InfiniteScrollHandle<P> & { pending?: AbortController }>({
    nextParam: undefined,
    reset() {
      setResult({ hasMore: true });
      setLoading(false);
      ref.nextParam = null as any;
      if (ref.pending) {
        ref.pending.abort();
        ref.pending = undefined;
      }
    },
  });

  const load = function () {
    if (!loadMore) return;
    if (ref.pending) {
      ref.pending.abort();
    } else {
      setLoading(true);
    }
    const abc = new AbortController();
    ref.pending = abc;

    const promise = loadMore(ref.nextParam as P, abc.signal).then(
      (res) => {
        if (ref.pending !== abc) return;
        ref.pending = undefined;
        setLoading(false);
        const hasMore = !!res.hasMore;
        setResult({ hasMore });
        ref.nextParam = res.nextParam as P;

        onPush?.(res.items);
      },
      (e) => {
        if (ref.pending !== abc) return;
        ref.pending = undefined;
        setLoading(false);
        setResult((res) => ({ ...res, error: true }));
        console.error(e);
      },
    );
  };
  const { containerRef, isInBottom, isInTop } = useScrollLoad({
    bottomThreshold,
    onScrollBottom() {
      if (ref.pending || !result.hasMore) return;

      if (bottomAutoLoad) load();
    },
  });

  useEffect(() => {
    if (loading || !result.hasMore || result.error) return;
    if (bottomAutoLoad && isInBottom()) load();
  }, [loading, result, bottomAutoLoad]);

  useEffect(() => {
    return () => {
      if (ref.pending) {
        ref.pending.abort();
        ref.pending = undefined;
      }
    };
  }, []);
  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
      <div
        className={footerClassName}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0", ...footerStyle }}
      >
        {result.hasMore ? (
          result.error && !loading ? (
            (errorRender ?? <div style={{ color: "red" }}>加载失败</div>)
          ) : loading ? (
            (loadingRender ?? <Spin />)
          ) : (
            <Button type="link" onClick={() => load()}>
              加载更多
            </Button>
          )
        ) : (
          (noMoreRender ?? "没有更多数据")
        )}
      </div>
    </div>
  );
}

export type InfiniteLoadResultType<T> = {
  ref: React.ReactElement;
  data: T[] | undefined;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  reset: () => void;
  hasMore: boolean;
  loading: boolean;
};

export type ScrollLoadParam = {
  onScrollBottom?: () => void;
  bottomThreshold?: number;
  onScrollTop?: () => void;
  topThreshold?: number;
};
export type ScrollLoadResult = {
  containerRef: (element: HTMLDivElement | null) => void;
  isInTop(): boolean;
  isInBottom(): boolean;
};
export function useScrollLoad(param: ScrollLoadParam = {}): ScrollLoadResult {
  const { onScrollBottom, onScrollTop } = param;
  const { current: container } = useRef<{
    dom: HTMLDivElement | null;
    lastListener?: (this: HTMLElement) => void;
    checker: (this: HTMLElement) => void;
    bottomVisible?: boolean;
    topVisible?: boolean;
    bottomThreshold: number;
    topThreshold: number;
  }>({ dom: null, bottomThreshold: param.bottomThreshold ?? 10, topThreshold: param.topThreshold ?? 10 } as any);
  container.checker = function (this: HTMLElement) {
    const { bottomThreshold, bottomVisible, topThreshold, topVisible } = container;
    if (isBottom(this, bottomThreshold)) {
      if (!bottomVisible) {
        container.bottomVisible = true;
        onScrollBottom?.();
      }
    } else {
      if (bottomVisible) container.bottomVisible = false;
    }

    if (isTop(this, topThreshold)) {
      if (!topVisible) {
        container.topVisible = true;
        onScrollTop?.();
      }
    } else {
      if (topVisible) container.topVisible = false;
    }
  };

  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (container.dom && container.lastListener) {
      container.dom.removeEventListener("scroll", container.lastListener);
      container.dom = null;
    }
    if (!element) return;
    container.dom = element;
    container.lastListener = function () {
      container.checker.call(this);
    };
    element.addEventListener("scroll", container.lastListener);
  }, []);

  const isInBottom = useCallback((): boolean => {
    if (!container.dom) return false;
    return isBottom(container.dom, container.bottomThreshold);
  }, []);
  const isInTop = useCallback((): boolean => {
    if (!container.dom) return false;
    return isBottom(container.dom, container.topThreshold);
  }, []);

  return { containerRef: containerRef, isInBottom, isInTop };
}

function isTop(dom: HTMLElement, topThreshold: number) {
  return dom.scrollTop < topThreshold;
}
function isBottom(dom: HTMLElement, bottomThreshold: number) {
  const { scrollTop, scrollHeight, clientHeight } = dom;
  const scrollBottom = scrollHeight - scrollTop - clientHeight;
  return scrollBottom < bottomThreshold;
}

/* 


- 加载一组数据后如果触发器仍可见，且仍有数据，则继续加载
- 数据不在加载装固态，触发器从不可见状态移动到可见是，如果仍有数据，则触发加载
- 数据在加载装状态，触发器可见状态变化不会触发加载
- 没有更多数据，触发器可见状态变化不会触发加载

*/
