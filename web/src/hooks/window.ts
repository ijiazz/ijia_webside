import { useEffect, useReducer, useRef } from "react";
function getWindowSize() {
  return { height: document.body.clientHeight, width: document.body.clientWidth };
}
export function useWindowResize(onResize?: () => void) {
  const [windowSize, updateWindowSize] = useReducer(getWindowSize, getWindowSize());
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
