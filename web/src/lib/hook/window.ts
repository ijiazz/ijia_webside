import { useEffect, useReducer, useRef } from "react";
export function getWindowSize() {
  if (typeof window === "undefined") {
    return { height: 0, width: 0 };
  }
  return { height: document.body.clientHeight, width: document.body.clientWidth };
}
type WindowSize = {
  height: number;
  width: number;
};
/**
 * 如果在服务端渲染，宽高将返回 0
 */
export function useWindowResize(onResize?: () => void): WindowSize {
  const [windowSize, updateWindowSize] = useReducer(getWindowSize, undefined, getWindowSize);
  const ref = useRef(onResize);
  ref.current = onResize;
  useEffect(() => {
    const onResize = () => {
      ref.current?.();
      updateWindowSize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return windowSize;
}
