import { useRef, useCallback } from "react";

export type ScrollLoadParam = {
  onScrollBottom?: () => void;
  bottomThreshold?: number;
  onScrollTop?: () => void;
  topThreshold?: number;
};
export type ScrollLoadResult = {
  ref: (element: HTMLDivElement | null) => void;
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

  return { ref: containerRef, isInBottom, isInTop };
}

function isTop(dom: HTMLElement, topThreshold: number) {
  return dom.scrollTop < topThreshold;
}
function isBottom(dom: HTMLElement, bottomThreshold: number) {
  const { scrollTop, scrollHeight, clientHeight } = dom;
  const scrollBottom = scrollHeight - scrollTop - clientHeight;
  return scrollBottom < bottomThreshold;
}
