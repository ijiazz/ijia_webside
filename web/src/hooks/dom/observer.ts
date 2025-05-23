import { useEffect } from "react";

export function useElementOverScreen(
  onChange: (isOver: boolean) => void,
  ref?: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const element = ref?.current;
    if (!element) return;
    let isFirst = true;
    const observer = new IntersectionObserver((entries) => {
      if (isFirst) {
        isFirst = false;
        return;
      }
      entries.forEach((entry) => {
        onChange(entry.isIntersecting);
      });
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}
