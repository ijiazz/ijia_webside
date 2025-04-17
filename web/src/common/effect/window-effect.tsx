import { PropsWithChildren, useRef } from "react";
import { useEffect } from "react";

export function WindowEffect(props: PropsWithChildren<{}>) {
  const ref = useRef(false);
  useEffect(() => {
    let clear: undefined | (() => void);
    let mode: "confetti" | "snow" | undefined = "confetti";
    import("./confetti.ts").then((mod) => {
      if (ref.current) return;
      switch (mode) {
        case "snow":
          clear = mod.playSnow().stop;
          break;

        case "confetti":
          clear = mod.playConfetti().stop;
          break;
        default:
          break;
      }
    });
    return () => {
      clear?.();
      ref.current = true;
    };
  }, []);
  return props.children;
  return null;
}
