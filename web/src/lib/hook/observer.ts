import { useEffect, useMemo, useRef, useCallback } from "react";

export function useElementOverScreen(option: {
  onChange: (isOver: boolean) => void;
  /** 默认为 true. IntersectionObserver 检测与 前一次 visible 不一样时触发 onChange */
  defaultVisible?: boolean;
}) {
  const { onChange } = option;
  const onChangeRef = useRef<(isOver: boolean) => void>(onChange);
  onChangeRef.current = onChange;
  const elementRef = useRef<{ element?: HTMLElement; prevVisible: boolean }>({
    prevVisible: option.defaultVisible ?? true,
  });

  const observer = useMemo(() => {
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const prevVisibleRef = elementRef.current;

        if (prevVisibleRef.prevVisible !== entry.isIntersecting) {
          onChangeRef.current(entry.isIntersecting);
        }
        prevVisibleRef.prevVisible = entry.isIntersecting;
      });
    });
  }, []);
  const ref = useCallback((element: HTMLElement | null) => {
    const { element: prevElement } = elementRef.current;
    if (element === prevElement) return;
    if (prevElement) {
      observer.unobserve(prevElement);
    }
    if (element) observer.observe(element);
  }, []);

  useEffect(() => {
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, isIntersecting: () => elementRef.current.prevVisible };
}
